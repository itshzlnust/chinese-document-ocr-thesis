import { WordInfo } from '../types';
import { getDictionaryEntry } from '../data/cc_cedict_sample';

export class DictionaryService {
  public static lookup(character: string): WordInfo {
    return getDictionaryEntry(character);
  }

  public static speak(text: string, lang = 'zh-CN') {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // cancel previous audio
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.85; // Slightly slower for language learners
      window.speechSynthesis.speak(utterance);
    }
  }
}
