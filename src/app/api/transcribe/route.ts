import { NextRequest } from "next/server";


export async function POST(req: NextRequest) {
  const { fileName } = await req.json();

  const mySecret = process.env.DEEPGRAM_KEY

  const url = `https://impel-audio-deepgram.s3.eu-west-1.amazonaws.com/audio/${fileName}`
  
  const response = await fetch('https://api.deepgram.com/v1/listen?tier=enhanced&punctuate=true&paragraphs=true&diarize=true&keywords=Bekah:2&keywords=Hacktoberfest:2', {
        method: 'POST', headers: { 'Authorization': 'Token ' + mySecret, 'Content-Type': 'application/json' }, body: JSON.stringify({ url })
  });

  const json = await response.json()
  const result = json.results.channels[0].alternatives[0].transcript;
  const words = json.results.channels[0].alternatives[0].words.map((value: any) => value.word);

  return Response.json({ status: 200, transcribe: result, words })
}
