// Import built-in Node.js package path.
const path = require('path');



/**
 * Import the ServiceNowConnector class from local Node.js module connector.js
 *   and assign it to constant ServiceNowConnector.
 * When importing local modules, IAP requires an absolute file reference.
 * Built-in module path's join method constructs the absolute filename.
 */
const ServiceNowConnector = require(path.join(__dirname, '/connector.js'));



/**
 * Import built-in Node.js package events' EventEmitter class and
 * assign it to constant EventEmitter. We will create a child class
 * from this class.
 */
const EventEmitter = require('events').EventEmitter;



/**
 * The ServiceNowAdapter class.
 *
 * @summary ServiceNow Change Request Adapter
 * @description This class contains IAP adapter properties and methods that IAP
 *   brokers and products can execute. This class inherits the EventEmitter
 *   class.
 */
class ServiceNowAdapter extends EventEmitter {



    /**
     * Here we document the ServiceNowAdapter class' callback. It must follow IAP's
     *   data-first convention.
     * @callback ServiceNowAdapter~requestCallback
     * @param {(object|string)} responseData - The entire REST API response.
     * @param {error} [errorMessage] - An error thrown by REST API call.
     */



    /**
     * Here we document the adapter properties.
     * @typedef {object} ServiceNowAdapter~adapterProperties - Adapter
     *   instance's properties object.
     * @property {string} url - ServiceNow instance URL.
     * @property {object} auth - ServiceNow instance credentials.
     * @property {string} auth.username - Login username.
     * @property {string} auth.password - Login password.
     * @property {string} serviceNowTable - The change request table name.
     */



    /**
     * @memberof ServiceNowAdapter
     * @constructs
     *
     * @description Instantiates a new instance of the Itential ServiceNow Adapter.
     * @param {string} id - Adapter instance's ID.
     * @param {ServiceNowAdapter~adapterProperties} adapterProperties - Adapter instance's properties object.
     */

    constructor(id, adapterProperties) {

        // Call super or parent class' constructor.
        super();
        // Copy arguments' values to object properties.
        log.info("adapterProperties",adapterProperties);
        this.id = id;
        this.props = adapterProperties;
        // Instantiate an object from the connector.js module and assign it to an object property.
        this.connector = new ServiceNowConnector({
            url: this.props.url,
            username: this.props.auth.username,
            password: this.props.auth.password,
            serviceNowTable: this.props.serviceNowTable
        });
         log.info("connector ****",this.connector);
    }



    /**
     * @memberof ServiceNowAdapter
     * @method connect
     * @summary Connect to ServiceNow
     * @description Complete a single healthcheck and emit ONLINE or OFFLINE.
     *   IAP calls this method after instantiating an object from the class.
     *   There is no need for parameters because all connection details
     *   were passed to the object's constructor and assigned to object property this.props.
     */

    connect() {

        // As a best practice, Itential recommends isolating the health check action
        // in its own method.
        this.healthcheck(() => { });
    }



    /**
     * @memberof ServiceNowAdapter
     * @method healthcheck
     * @summary Check ServiceNow Health
     * @description Verifies external system is available and healthy.
     *   Calls method emitOnline if external system is available.
     *
     * @param {ServiceNowAdapter~requestCallback} [callback] - The optional callback
     *   that handles the response.
     */

    healthcheck(callback) {
        log.debug("Health check called");
        this.getRecord((result, error) => {
            if (error) {
                this.emitOffline();
                log.error(`${this.id} : ${error}`);
                callback(null, error);
            } else {
                this.emitOnline();
                log.debug(`${this.id} is ONLINE`);
                callback(result, null);
            }
        });
    }



    /**
     * @memberof ServiceNowAdapter
     * @method emitOffline
     * @summary Emit OFFLINE
     * @description Emits an OFFLINE event to IAP indicating the external
     *   system is not available.
     */

    emitOffline() {

        this.emitStatus('OFFLINE');
        log.warn('ServiceNow: Instance is unavailable.');

    }



    /**
     * @memberof ServiceNowAdapter
     * @method emitOnline
     * @summary Emit ONLINE
     * @description Emits an ONLINE event to IAP indicating external
     *   system is available.
     */

    emitOnline() {

        this.emitStatus('ONLINE');
        log.info('ServiceNow: Instance is available.');
    }



    /**
     * @memberof ServiceNowAdapter
     * @method emitStatus
     * @summary Emit an Event
     * @description Calls inherited emit method. IAP requires the event
     *   and an object identifying the adapter instance.
     *
     * @param {string} status - The event to emit.
     */
    emitStatus(status) {
        this.emit(status, { id: this.id });
    }



    /**
     * @memberof ServiceNowAdapter
     * @method getRecord
     * @summary Get ServiceNow Record
     * @description Retrieves a record from ServiceNow.
     *
     * @param {ServiceNowAdapter~requestCallback} callback - The callback that
     *   handles the response.
     */

    getRecord(callback) {
        this.connector.get((data, error) => {
            if (error) {
                console.error(`\nError returned from GET request:\n${JSON.stringify(error)}`);
                callback(error);
            }
            else {
                let body = null;
                //log.info(`\nResponse returned from GET request:\n${JSON.stringify(data)}`);
                if (typeof data == 'object') {
                    if (data.body) {
                        body = JSON.parse(data.body);
                        let result = body.result;
                        result.forEach((obj, index) => {
                            result[index] = this.getResult(obj);
                        });
                        log.info("Retunring " + JSON.stringify(result))
                        callback(result);
                        //return result;
                    }
                }
            }
        });
    }



    /**
     * @memberof ServiceNowAdapter
     * @method postRecord
     * @summary Create ServiceNow Record
     * @description Creates a record in ServiceNow.
     *
     * @param {ServiceNowAdapter~requestCallback} callback - The callback that
     *   handles the response.
     */

    postRecord(callback) {
        this.connector.post((data, error) => {
            log.info("postRecord started  connectorpost****");
            if (error) {
                console.error(`\nError returned from POST request:\n${JSON.stringify(error)}`);
            }
            else {
                let result = null;
                if (typeof data == 'object') {
                    console.info(JSON.stringify(data));
                    if (data.body) {
                        let body = JSON.parse(data.body);
                        result = body.result;
                        result = this.getResult(result);
                    }
                }
                callback(result);

            }

        });

    }



    /**
     * @memberof ServiceNowAdapter
     * @method getResult
     * @summary Build custom result object.
     * @description Builds a new result object from response data.
     *
     * @param {object} responseData - The response json result
     */

    getResult(responseData) {

        return {
            'change_ticket_key': responseData.sys_id,
            'change_ticket_number': responseData.number,
            'active': responseData.active,
            'priority': responseData.priority,
            'description': responseData.description,
            'work_start': responseData.work_start,
            'work_end': responseData.work_end
        };

    }

}
module.exports = ServiceNowAdapter;