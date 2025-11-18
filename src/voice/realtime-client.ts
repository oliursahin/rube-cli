import { OpenAI } from 'openai';
import * as fs from 'fs';
import * as path from 'path';

const SAMPLE_RATE = 24000;

export interface VoiceInput {
  text: string;
  audioData: Buffer;
}

export interface VoiceOutput {
  text: string;
  audioData?: Buffer;
}

export class RealtimeVoiceClient {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Process audio input and get text transcription
   * Using OpenAI Realtime API for streaming speech-to-text
   */
  async processAudioInput(audioPath: string): Promise<string> {
    try {
      const audioBuffer = fs.readFileSync(audioPath);

      // Use OpenAI Whisper for transcription
      // Note: In production, this would use the Realtime API for streaming
      const transcript = await this.openai.audio.transcriptions.create({
        file: new File([audioBuffer], 'audio.webm', { type: 'audio/webm' }),
        model: 'whisper-1',
        language: 'en',
      });

      return transcript.text;
    } catch (error) {
      console.error('Error processing audio:', error);
      throw error;
    }
  }

  /**
   * Generate speech from text using OpenAI TTS
   */
  async generateSpeech(text: string, outputPath?: string): Promise<Buffer> {
    try {
      const mp3 = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: text,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());

      if (outputPath) {
        fs.writeFileSync(outputPath, buffer);
      }

      return buffer;
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  }

  /**
   * Full voice interaction cycle:
   * 1. Listen to user (audio input)
   * 2. Send to agent for processing
   * 3. Generate response speech
   */
  async voiceInteraction(
    audioPath: string,
    agentHandler: (text: string) => Promise<string>
  ): Promise<VoiceOutput> {
    // Step 1: Transcribe audio input
    const userText = await this.processAudioInput(audioPath);
    console.log(`User said: "${userText}"`);

    // Step 2: Send to agent for processing
    const agentResponse = await agentHandler(userText);
    console.log(`Agent response: "${agentResponse}"`);

    // Step 3: Generate speech output
    const audioData = await this.generateSpeech(agentResponse);

    return {
      text: agentResponse,
      audioData,
    };
  }
}

export default RealtimeVoiceClient;
