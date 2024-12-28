import { Player, RawMessage } from "@minecraft/server";
import { ActionFormData, ModalFormData, MessageFormData, FormCancelationReason } from "@minecraft/server-ui";

export class BaseFormBuilder<SubmitValue> {
    protected readonly data: Record<string, any> = {};

    protected constructor(title?: string | RawMessage) {
        if (title) this.setTitle(title);
    }

    setTitle(title: string | RawMessage) {
        this.data.title = title;
        return this;
    }

    onSubmit(callback: (value: SubmitValue) => void) {
        this.data.submit = callback;
        return this;
    }
    
    onCancel(reason: keyof typeof FormCancelationReason, callback: () => void): this;
    onCancel(callback: (reason?: FormCancelationReason | undefined) => void): this;
    onCancel(reason: any, callback?: any) {
        this.data.cancel = typeof reason === "function" ? { callback: reason } : { reason, callback };
        return this;
    }

    protected cancel(reason?: FormCancelationReason | undefined) {
        const { cancel } = this.data;
        if (!cancel) return;
        if ("reason" in cancel) {
            if (FormCancelationReason[cancel.reason] === reason) cancel.callback();
        }
        else {
            cancel.callback(reason);
        }
    }
    
    async show(player: Player): Promise<void> {
        throw ReferenceError("This method is not implemented.");
    }
}

/// <!--- ActionForm

export class ActionFormBuilder extends BaseFormBuilder<number> {
    constructor(title?: string | RawMessage, formatter?: (text: string) => string) {
        super(title);
        if (formatter) this.globalFormat(formatter);
        this.data.buttons = [];
    }

    globalFormat(formatter: (text: string) => string) {
        this.data.globalFormat = formatter;
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
        const f: <T>(text: T) => T = (text: any) => (typeof text == "string" && "globalFormat" in this.data)
            ? this.data.globalFormat(text) : text;

        const form = new ActionFormData();
        if ("title" in this.data) form.title(f(this.data.title));
        if ("body" in this.data) form.body(this.data.body);

        const buttons: any[] = this.data.buttons, callbacks: ((player: Player) => void)[] = [];
        if ("backButton" in this.data) buttons.push(this.data.backButton);
        if ("closeButton" in this.data) buttons.push(this.data.closeButton);
        for (const { active = true, label, iconPath, callback } of buttons) {
            if (active) {
                form.button(f(label), iconPath);
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

/// ActionForm --->

/// <!--- ModalForm

export class ModalFormBuilder extends BaseFormBuilder<(string | number | boolean)[]> {
    constructor(title?: string | RawMessage) {
        super(title);
        this.data.contents = [];
    }

    addDropdown(dropdown: ModalFormDropdown, callback?: ModalFormContentCallback<any>) {
        this.data.contents.push({ dropdown, callback });
        return this;
    }

    addSlider(slider: ModalFormSlider, callback?: ModalFormContentCallback<number>) {
        this.data.contents.push({ slider, callback });
        return this;
    }

    addTextField(textField: ModalFormTextField, callback?: ModalFormContentCallback<string>) {
        this.data.contents.push({ textField, callback });
        return this;
    }

    addToggle(toggle: ModalFormToggle, callback?: ModalFormContentCallback<boolean>) {
        this.data.contents.push({ toggle, callback });
        return this;
    }

    setSubmitText(text: string | RawMessage) {
        this.data.submitText = text;
        return this;
    }

    async show(player: Player) {
        const form = new ModalFormData();
        if ("title" in this.data) form.title(this.data.title);
        if ("submitText" in this.data) form.submitButton(this.data.submitText);
        for (const content of this.data.contents) {
            if ("dropdown" in content) {
                const { active = true, label, options, defaultIndex } = content.dropdown;
                if (active) form.dropdown(label, options.map((option) => ("label" in option && "value" in option) ? option.label : option), defaultIndex);
            }
            if ("slider" in content) {
                const { active = true, label, min, max, step, defaultValue } = content.slider;
                if (active) form.slider(label, min, max, step, defaultValue);
            }
            if ("textField" in content) {
                const { active = true, label, placeHolder, defaultValue } = content.textField;
                if (active) form.textField(label, placeHolder, defaultValue);
            }
            if ("toggle" in content) {
                const { active = true, label, defaultValue } = content.toggle;
                if (active) form.toggle(label, defaultValue);
            }
        }
    
        const { formValues = [], canceled, cancelationReason } = await form.show(player);
        if (canceled) {
            this.cancel(cancelationReason);
        }
        else {
            this.data.submit?.(formValues);
            for (let i = 0; i < formValues.length; i++) {
                let value = formValues[i];
                const content = this.data.contents[i];
                if ("dropdown" in content) {
                    if (typeof value === "number") {
                        const option = content.options[value];
                        value = ("label" in option && "value" in option) ? option.value : option;
                    }
                }
                content.callback?.(value);
            }
        }
    }
}

export interface ModalFormDropdown {
    label: string | RawMessage;
    options: (string | RawMessage | ModalFormDropdownOption)[];
    defaultIndex?: number;
    active?: boolean;
} 

export interface ModalFormDropdownOption {
    label: string;
    value: any;
}

export interface ModalFormSlider {
    label: string;
    min: number;
    max: number;
    step: number;
    defaultValue?: number;
    active?: boolean;
}

export interface ModalFormTextField {
    label: string;
    placeHolder: string;
    defaultValue?: string;
    active?: boolean;
}

export interface ModalFormToggle {
    label: string;
    defaultValue?: boolean;
    active?: boolean;
}

export type ModalFormContentCallback<V> = (value: V, player: Player) => void;

/// ModalForm --->


/// <!--- MessageForm

export class MessageFormBuilder extends BaseFormBuilder<MessageButtonPosition> {
    constructor(title?: string | RawMessage) {
        super(title);
    }

    setBody(body: string | string[] | RawMessage) {
        this.data.body = Array.isArray(body) ? body.join("\n") : body;
        return this;
    }

    setAboveButton(button: MessageFormButton, callback?: MessageFormButtonCallback) {
        this.data.above = { ...button, callback };
        return this;
    }

    setBelowButton(button: MessageFormButton, callback?: MessageFormButtonCallback) {
        this.data.below = { ...button, callback };
        return this;
    }

    async show(player: Player) {
        const form = new MessageFormData();
        if ("title" in this.data) form.title(this.data.title);
        if ("body" in this.data) form.body(this.data.body);
        if ("above" in this.data) form.button1(this.data.above.label);
        if ("below" in this.data) form.button2(this.data.below.label);

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

/// MessageForm --->