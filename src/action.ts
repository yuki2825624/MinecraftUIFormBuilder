import { Player, RawMessage } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { BaseFormBuilder } from "./base";

export class ActionFormBuilder extends BaseFormBuilder<number> {
    constructor(title?: string | RawMessage) {
        super(title);
        this.data.buttons = [];
    }

    setBody(body: string | string[] | RawMessage) {
        this.data.body = Array.isArray(body) ? body.join("\n") : body;
        return this;
    }

    addButton(button: ActionFormButton, callback?: ActionFormButtonCallback) {
        this.data.buttons.push({ ...button, callback });
        return this;
    }

    setBackButton(button: ActionFormButton, callback?: ActionFormButtonCallback) {
        button.iconPath ??= "textures/ui/back_button_default.png";
        this.data.backButton = { ...button, callback };
        return this;
    }

    setCloseButton(button: ActionFormButton, callback?: ActionFormButtonCallback) {
        button.iconPath ??= "textures/ui/close_button_default.png";
        this.data.closeButton = { ...button, callback };
        return this;
    }

    async show(player: Player) {
        const form = new ActionFormData();
        if ("title" in this.data) form.title(this.data.title);
        if ("body" in this.data) form.body(this.data.body);

        const buttons: any[] = this.data.buttons, callbacks: ((player: Player) => void)[] = [];
        if ("backButton" in this.data) buttons.push(this.data.backButton);
        if ("closeButton" in this.data) buttons.push(this.data.closeButton);
        for (const { active = true, label, iconPath, callback } of buttons) {
            if (active) {
                form.button(label, iconPath);
                callbacks.push(callback);
            }
        }

        const { selection, canceled, cancelationReason } = await form.show(player);
        if (canceled) {
            this.cancel(cancelationReason);
        }
        else {
            if (typeof selection !== "number") return;
            this.data.submit?.(selection);
            const callback = callbacks[selection];
            callback?.(player);
        }
    }
}

export interface ActionFormButton {
    label: string | RawMessage;
    iconPath?: string;
    active?: boolean;
}

export type ActionFormButtonCallback = (player: Player) => void;
