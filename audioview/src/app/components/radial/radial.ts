import { Component, input, OnInit } from '@angular/core';

@Component({
  selector: 'app-radial',
  imports: [],
  templateUrl: './radial.html',
  styleUrl: './radial.css',
})
export class Radial implements OnInit {
  radialPoints = input<{ x: number, y: number, angle: number }[]>();
  radialIntensity = input<number>();
  svgHeight = input<number>(250);
  svgWidth = 600;

  //condiguracion inicial de radial (interna)
  radialPointsCount = 12;
  radialBaseRadius = 10;
  radialMaxOffset = 1;


  initRadial = () => {
    const centerX = this.svgWidth / 2;
    const centerY = 200 / 2;

    for (let i = 0; i < this.radialPointsCount; i++) {
      const angle = (Math.PI * 2 / this.radialPointsCount) * i;

      const x = centerX + Math.cos(angle) * this.radialBaseRadius;
      const y = centerY + Math.sin(angle) * this.radialBaseRadius;

      this.radialPoints()!.push({ x, y, angle });
    }

  }

  ngOnInit(): void {
    this.initRadial();
  }
}
