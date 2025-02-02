import { Player, RawMessage } from "@minecraft/server";
import { FormCancelationReason } from "@minecraft/server-ui";

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