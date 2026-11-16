// The test reads the real files of the model that the app serves.
/// <reference types="node" />
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MODEL_INPUT_SIZE, MODEL_URL } from './model-info';

const folder = resolve(process.cwd(), 'public', 'models', 'pothole');
const info = JSON.parse(readFileSync(resolve(folder, 'model_info.json'), 'utf8')) as {
  format: string;
  input_size: number;
  classes: string[];
  half_precision: boolean;
  size_bytes: number;
};

describe('the model files of the app', () => {
  it('are served at the address the app downloads from', () => {
    expect(MODEL_URL).toBe('/models/pothole/best.onnx');
    expect(statSync(resolve(folder, 'best.onnx')).isFile()).toBe(true);
  });

  it('say the same input size as the code', () => {
    expect(info.input_size).toBe(MODEL_INPUT_SIZE);
  });

  it('say the model is ONNX, with one class (pothole) and numbers of full precision', () => {
    expect(info.format).toBe('onnx');
    expect(info.classes).toEqual(['pothole']);
    expect(info.half_precision).toBe(false);
  });

  it('say the real size of the model file', () => {
    expect(statSync(resolve(folder, 'best.onnx')).size).toBe(info.size_bytes);
  });
});
