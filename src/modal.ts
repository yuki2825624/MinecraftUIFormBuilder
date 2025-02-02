import { Player, RawMessage } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { BaseFormBuilder } from "./base";

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
                        const option = content.dropdown.options[value];
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