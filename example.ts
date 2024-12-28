import { Player } from "@minecraft/server";
import { ActionFormBuilder, MessageFormBuilder, ModalFormBuilder } from "./index";

function ActionFormExampleMenu(player: Player) {
    const form = new ActionFormBuilder("Title", (text) => `§l§0${text}§r`)
        .setBody("Body")
        .addButton({ label: "Next" }, ModalFormExampleMenu)
        .setCloseButton({ label: "Close" })
        .onCancel("UserBusy", () => ActionFormExampleMenu(player))
        .onSubmit(() => console.warn("Click Button"));
    for (let i = 0; i < 10; i++)
        form.addButton({ label: `Button#${String(i).padStart(2, "0")}` });
    return form.show(player);
}

function ModalFormExampleMenu(player: Player) {
    const form = new ModalFormBuilder("§l§0Title§r")
        .addDropdown({
            label: "Dropdown",
            options: [
                { label: "Next", value: MessageFormExampleMenu(player) },
                { label: "Back", value: ActionFormExampleMenu(player) }
            ]
        }, (callback) => callback(player))
        .addSlider({ label: "Slider", min: 0, max: 10, step: 1 }, (value) => console.warn(`The value in the 'Slider' is ${value}`))
        .addTextField({ label: "TextField", placeHolder: "Input Text" }, (text) => console.warn(`The value in the 'TextField' is '${text}'`))
        .addToggle({ label: "Toggle" }, (value) => console.warn(`The value in the 'Toggle' is '${value}'`))
        .setSubmitText("Submit!")
        .onCancel("UserClosed", () => ModalFormExampleMenu(player))
        .onSubmit(() => console.warn("Send Datas"));
    return form.show(player);
}

function MessageFormExampleMenu(player: Player) {
    const form = new MessageFormBuilder("§l§0Title§r")
        .setBody("Body")
        .setAboveButton({ label: "§l§0Back§r" }, ModalFormExampleMenu)
        .setBelowButton({ label: "§l§0Close§r" })
        .onCancel("UserClosed", () => MessageFormExampleMenu(player))
        .onSubmit(() => console.warn("Click Button"));
    return form.show(player);
}