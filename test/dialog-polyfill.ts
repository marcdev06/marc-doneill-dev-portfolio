// jsdom has no modal dialogs; this mimics what the tests rely on
export function installDialogPolyfill() {
  const dialogPrototype = window.HTMLDialogElement.prototype;
  dialogPrototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  dialogPrototype.close = function close(this: HTMLDialogElement) {
    if (!this.open) {
      return;
    }
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}
