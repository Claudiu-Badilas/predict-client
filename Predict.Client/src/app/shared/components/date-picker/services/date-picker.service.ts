export class DatePickerService {
  private openDatepickers: Set<string> = new Set();
  private closeCallbacks: Map<string, () => void> = new Map();

  registerDatepicker(id: string, closeCallback: () => void) {
    this.closeCallbacks.set(id, closeCallback);
  }

  unregisterDatepicker(id: string) {
    this.closeCallbacks.delete(id);
    this.openDatepickers.delete(id);
  }

  openDatepicker(id: string) {
    // Close all other open datepickers
    this.openDatepickers.forEach((openId) => {
      if (openId !== id && this.closeCallbacks.has(openId)) {
        this.closeCallbacks.get(openId)!();
      }
    });

    this.openDatepickers.add(id);
  }

  closeDatepicker(id: string) {
    this.openDatepickers.delete(id);
  }

  isDatepickerOpen(id: string): boolean {
    return this.openDatepickers.has(id);
  }
}
