import {
  Component,
  Input,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';

@Component({
  selector: 'p-success-modal',
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './success-modal.component.html',
})
export class SuccessModalComponent {
  @Input() message = 'Operation completed successfully';

  activeModal = inject(NgbActiveModal);
  private router = inject(Router);

  goToPage() {
    this.activeModal.close();
    this.router.navigate(['/dashboard']); // change route as needed
  }
}
