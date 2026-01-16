import { Component, input } from '@angular/core';

@Component({
  selector: 'app-wave',
  imports: [],
  templateUrl: './wave.html',
  styleUrl: './wave.css',
})
export class Wave {
  wavePath = input<string>("");

}
