import { Component, inject, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogRef,
    MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';

export interface DialogData {
    name: string;
}

@Component({
    selector: 'save-dialog',
    templateUrl: 'save-dialog.html',
    imports: [
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatDialogClose,
    ],
})
export class SaveDialog {
    readonly dialogRef = inject(MatDialogRef<SaveDialog>);
    readonly data = inject<DialogData>(MAT_DIALOG_DATA);
    readonly name = model(this.data.name);

    onNoClick(): void {
        this.dialogRef.close();
    }
}