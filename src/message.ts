import { Player, RawMessage } from "@minecraft/server";
import { MessageFormData } from "@minecraft/server-ui";
import { BaseFormBuilder } from "./base";

export class MessageFormBuilder extends BaseFormBuilder<MessageButtonPosition> {
    constructor(title?: string | RawMessage) {
        super(title);
    }

    setBody(body: string | string[] | RawMessage) {
        this.data.body = Array.isArray(body) ? body.join("\n") : body;
        return this;
    }

    setBelowButton(button: MessageFormButton, callback?: MessageFormButtonCallback) {
        this.data.below = { ...button, callback };
        return this;
    }

    setAboveButton(button: MessageFormButton, callback?: MessageFormButtonCallback) {
        this.data.above = { ...button, callback };
        return this;
    }

    async show(player: Player) {
        const form = new MessageFormData();
        if ("title" in this.data) form.title(this.data.title);
        if ("body" in this.data) form.body(this.data.body);
        if ("below" in this.data) form.button1(this.data.below.label);
        if ("above" in this.data) form.button2(this.data.above.label);

        const { selection, canceled, cancelationReason } = await form.show(player);
        if (canceled) {
            this.cancel(cancelationReason);
        }
        else {
            if (selection === 0) {
                this.data.submit?.(MessageButtonPosition.Below);
                this.data.below.callback?.(player);
            }
            if (selection === 1) {
                this.data.submit?.(MessageButtonPosition.Above);
                this.data.above.callback?.(player);
            }
        }
    }
}

enum MessageButtonPosition {
    Above = "Above",
    Below = "Below"
}

export interface MessageFormButton {
    label: string | RawMessage;
}

export type MessageFormButtonCallback = (player: Player) => void;
