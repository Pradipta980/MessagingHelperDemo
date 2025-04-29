sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/message/Message",
    "messagingjs/utils/MessagingHelper",
    "sap/ui/model/Filter"
], (Controller, JSONModel, Message, MessagingHelper, Filter) => {
    "use strict";

    return Controller.extend("messagingjs.controller.View1", {
        onInit() {
            this.getView().setModel(new JSONModel({
                data: [{}, {}, {}, {}, {}]
            }), "viewModel");

            this._messagingHelper = new MessagingHelper();
            this.byId("_IDGenOverflowToolbar").insertContent(this._messagingHelper.getMessageButton(), 0);
            // // setting filter for view's children
            // this.messagingHelper.setMessageFilters([new Filter("target", FilterOperator.StartsWith, this.getView()?.getId())]);
            // or
            //setting filter for view's children & manually added messages with binding path and model
            this._messagingHelper.setMessageFilters(
                new Filter({
                    filters: [
                        new Filter("target", "StartsWith", this.getView()?.getId()),
                        new Filter("processor", "EQ", this.getView()?.getModel("viewModel")),
                    ],
                    and: false
                })
            );
        },

        onPress() {

            let i = 0;
            const aMessage = [];
            while (i < 500) {
                aMessage.push(new Message({
                    type: Math.floor((Math.random() * 10000)%2) ? "Success" : "Warning",
                    message: `${i * 10} Error message`,
                    additionalText: "Additional text",
                    target: "/Propety",
                    processor: this.getView()?.getModel("viewModel")
                }));
                i++
            }

            this._messagingHelper.addMessages(aMessage);
            this._messagingHelper.toggleMessagePopover();
        },

        onPress1() {
            this._messagingHelper.removeAllMessages();
        },

        onPress2() {
            this._messagingHelper.removeMessages([
                { sTarget: "/Propety" },
                // {target: this.getView()?.getId() as string}
            ]);
            this._messagingHelper.toggleMessagePopover();
        }

    });
});