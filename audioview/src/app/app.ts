import { Component } from '@angular/core';
import { AudioView } from './components/audio-view/audio-view';

@Component({
  selector: 'app-root',
  imports: [AudioView],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
