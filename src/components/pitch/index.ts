// Pitch / sales deck kit — barrel.
//
// A reusable in-app deck/slide system. Compose slides from the primitives in
// `slides`, drive them with `DeckShell`, or present the ready-made
// `atlvsPitchDeck()` sample. Everything is token-styled (--p-*) and Anton-headed.
export { DeckShell } from "./DeckShell";
export {
  Slide,
  TitleSlide,
  StatSlide,
  QuoteSlide,
  AgendaSlide,
  SectionSlide,
  TwoColSlide,
  CloseSlide,
} from "./slides";
export { atlvsPitchDeck } from "./templates";
