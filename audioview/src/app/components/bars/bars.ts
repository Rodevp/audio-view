import { Component, input } from '@angular/core';

@Component({
  selector: 'app-bars',
  imports: [],
  templateUrl: './bars.html',
  styleUrl: './bars.css',
})
export class Bars {
  bars = input<number[]>([]);
  svgWidth = input<number>(600);
  svgHeight = input<number>(200);
  barsCount = input<number>(28);
}
