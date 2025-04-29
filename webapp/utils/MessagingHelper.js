sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/Filter",
    "sap/m/MessagePopover",
    "sap/m/MessageItem",
    "sap/ui/core/ElementRegistry",
    "sap/ui/core/Messaging",
    "sap/m/Button"
], function (BaseObject, Filter, MessagePopover, MessageItem, ElementRegistry, Messaging, Button) {
    "use strict";

    return BaseObject.extend("messagingjs.helper.MessagingHelper", {
        constructor: function (aMessageFilter, fnGroupName) {
            BaseObject.call(this);
            this.getMessagePopover();
            this.setMessageFilters(aMessageFilter)
            this.setMessageGroupFormatter(fnGroupName);
            this.getMessageButton();
        },

        setMessageFilters(oMessageFilter) {
            const oMessageBinding = this.getMessagePopover().getBinding("items");
            oMessageBinding.filter(oMessageFilter);
        },

        setMessageGroupFormatter(fnGroupName) {
            this._fnGroupName = fnGroupName;
        },

        getMessagePopover() {
            this._oMessagePopover ??= new MessagePopover({
                activeTitlePress: (oEvent) => { this._onActiveTitlePress(oEvent) },
                items: {
                    path: "MessageModel>/",
                    templateShareable: false,
                    template: new MessageItem({
                        title: "{MessageModel>message}",
                        subtitle: "{MessageModel>additionalText}",
                        groupName: {
                            path: "MessageModel>",
                            formatter: (oMessage) => { return this._getGroupeName(oMessage); }
                        },
                        activeTitle: {
                            path: "MessageModel>controlIds",
                            formatter: (aControlIds) => { return aControlIds.length > 0; }
                        },
                        type: "{MessageModel>type}",
                        description: "{MessageModel>description}"
                    })
                }
            });

            this._oMessagePopover.setModel(Messaging.getMessageModel(), "MessageModel");
            this._oMessagePopover.getBinding("items").attachChange((oEvent) => { this._onMessageChange(oEvent) });

            return this._oMessagePopover;
        },

        getMessageButton() {
            return this._oMessageButton ??= new Button({
                press: () => { this.getMessagePopover().openBy(this._oMessageButton) },
                ariaHasPopup: "Dialog"
            });
        },

        toggleMessagePopover(bOpen = true) {
            const oMessageButton = this.getMessageButton();
            const oMessagePopover = this.getMessagePopover();
            setTimeout(() => { bOpen ? oMessagePopover.openBy(oMessageButton) : oMessagePopover.close() }, 10);
        },

        addMessages(vMessage) {
            Messaging.addMessages(vMessage);
        },

        removeMessages(vParams /* {sTarget, bPartial, oProcessor } | [{sTarget, bPartial, oProcessor }]*/) {
            vParams = Array.isArray(vParams) ? vParams : [vParams];
            const aFilter = vParams.map((oParam) => {
                const { sTarget, bPartial, oProcessor } = oParam;
                const aFiltersInternal = [];
                sTarget && aFiltersInternal.push(new Filter("target", bPartial ? "StartsWith" : "EQ", sTarget));
                oProcessor && aFiltersInternal.push(new Filter("processor", "EQ", oProcessor));
                return new Filter({ filters: aFiltersInternal, and: true });
            });

            const oDeleteListBinding = Messaging.getMessageModel().bindList("/");
            oDeleteListBinding.filter(new Filter({ filters: aFilter, and: false }));
            const aMessages = oDeleteListBinding.getAllCurrentContexts().map(oContext => oContext.getObject());
            oDeleteListBinding.destroy();
            this.deleteMessages(aMessages);
        },

        removeAllMessages() {
            const oListBinding = this.getMessagePopover().getBinding("items");
            const aMessages = oListBinding.getAllCurrentContexts().map(oContext => oContext.getObject());

            this.deleteMessages(aMessages);
        },

        deleteMessages(aMessageToDelete) {
            const aAllMessage = Messaging.getMessageModel().getData();
            const aMessagesToKeep = aAllMessage.filter((oMessage) => {
                return !aMessageToDelete.some(oMessageToDelete => oMessageToDelete.getId() === oMessage.getId());
            });

            //Performance inprovement for large message count
            //As message popover slows down
            Messaging.removeAllMessages();
            Messaging.addMessages(aMessagesToKeep);
        },

        _onActiveTitlePress(oEvent) {
            const oMessage = oEvent.getParameter("item").getBindingContext("MessageModel").getObject();
            const oControl = ElementRegistry.get(oMessage.getControlId());
            oControl?.focus?.();
        },

        _getGroupeName(oMessage) {
            return this._fnGroupName?.(oMessage);
        },

        _onMessageChange(oEvent) {
            const oListBinding = oEvent.getSource();
            const aAllContexts = oListBinding.getAllCurrentContexts();
            const oButton = this.getMessageButton();

            let sIcon = "sap-icon://information";
            let sHighestSeverity = "Neutral";

            aAllContexts.forEach((oContext) => {
                let oMessage = oContext.getObject();
                switch (oMessage.getType()) {
                    case "Error":
                        sIcon = "sap-icon://error";
                        sHighestSeverity = "Negative";
                        break;
                    case "Warning":
                        sIcon = sIcon !== "sap-icon://error" ? "sap-icon://alert" : sIcon;
                        sHighestSeverity = sHighestSeverity !== "Negative" ? "Critical" : sHighestSeverity;
                        break;
                    case "Success":
                        sIcon = sIcon !== "sap-icon://error" && sIcon !== "sap-icon://alert" ? "sap-icon://sys-enter-2" : sIcon;
                        sHighestSeverity = sHighestSeverity !== "Negative" && sHighestSeverity !== "Critical" ? "Success" : sHighestSeverity;
                        break;
                    default:
                        sIcon = !sIcon ? "sap-icon://information" : sIcon;
                        sHighestSeverity = !sHighestSeverity ? "Neutral" : sHighestSeverity;
                        break;
                }
            });

            oButton.setVisible(aAllContexts.length > 0);
            oButton.setIcon(sIcon);
            oButton.setType(sHighestSeverity);
            oButton.setText(aAllContexts.length);
        }

    });
});