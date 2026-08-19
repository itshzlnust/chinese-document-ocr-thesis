import { HanziStrokeData } from '../types';
import { getHanziVGStrokes } from '../data/hanzivg_data';

export class HanziVGService {
  public static getStrokesForCharacter(char: string): HanziStrokeData {
    return getHanziVGStrokes(char);
  }
}
