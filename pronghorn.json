{
  "id": "@acme/adapter-change_management",
  "type": "Adapter",
  "src": "main.js",
  "export": "ServiceNowAdapter",
  "roles": [
    "admin",
    "engineer",
    "operator"
  ],
  "methods": [
    {
      "name": "getRecord",
      "summary": "Get First Change Ticket",
      "description": "Get the first ServiceNow change management ticket.",
      "input": [],
      "output": {
        "name": "changeTicket",
        "type": "object",
        "description": "The first change change management ticket document.",
        "schema": {
          "title": "changeTicket",
          "$ref": "changeRequest#/definitions/changeTicket"
        }
      },
      "roles": [
        "admin",
        "engineer",
        "operator"
      ],
      "task": true
    }
  ]
}