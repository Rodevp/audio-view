import { Component, input } from '@angular/core';

@Component({
  selector: 'app-radial',
  imports: [],
  templateUrl: './radial.html',
  styleUrl: './radial.css',
})
export class Radial {
  radialPoints = input<{ x: number, y: number, angle: number }[]>();
  radialIntensity = input<number>();
}
