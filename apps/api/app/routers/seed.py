"""Seed endpoint for populating mock data."""
from fastapi import APIRouter, HTTPException
from app.services.database import supabase

router = APIRouter()


@router.post("/seed-mock-data/{episode_id}")
async def seed_mock_data(episode_id: str) -> dict[str, str]:
    """
    Populate an episode with realistic mock transcription data.
    This simulates what WhisperX and Pyannote would produce.
    """
    try:
        # Check if episode exists
        episode_result = supabase.table("episodes").select("*").eq("id", episode_id).execute()
        if not episode_result.data:
            raise HTTPException(status_code=404, detail="Episode not found")
        
        # Create mock speakers
        speakers_data = [
            {"episode_id": episode_id, "speaker_label": "SPEAKER_00", "mapped_name": "Host"},
            {"episode_id": episode_id, "speaker_label": "SPEAKER_01", "mapped_name": "Guest"},
        ]
        speakers_result = supabase.table("speakers").insert(speakers_data).execute()
        speakers = {s["speaker_label"]: s["id"] for s in speakers_result.data}
        
        # Create mock segments with realistic Portuguese podcast content
        segments_data = [
            {
                "episode_id": episode_id,
                "start_s": 0.0,
                "end_s": 5.2,
                "text": "Olá pessoal, bem-vindos a mais um episódio do nosso podcast!",
                "confidence": 0.95,
            },
            {
                "episode_id": episode_id,
                "start_s": 5.2,
                "end_s": 10.8,
                "text": "Hoje vamos falar sobre empreendedorismo e inovação no Brasil.",
                "confidence": 0.93,
            },
            {
                "episode_id": episode_id,
                "start_s": 10.8,
                "end_s": 16.5,
                "text": "Comigo está o André, que é fundador de várias startups de sucesso.",
                "confidence": 0.94,
            },
            {
                "episode_id": episode_id,
                "start_s": 16.5,
                "end_s": 21.3,
                "text": "Oi, muito obrigado pelo convite! É um prazer estar aqui.",
                "confidence": 0.96,
            },
            {
                "episode_id": episode_id,
                "start_s": 21.3,
                "end_s": 28.7,
                "text": "André, você pode contar um pouco sobre sua trajetória? Como começou no mundo do empreendedorismo?",
                "confidence": 0.92,
            },
            {
                "episode_id": episode_id,
                "start_s": 28.7,
                "end_s": 45.2,
                "text": "Claro! Comecei muito cedo, na verdade. Aos 20 anos já tinha minha primeira empresa. Foi muito desafiador, mas aprendi que o segredo está em nunca desistir e sempre buscar aprender com os erros.",
                "confidence": 0.94,
            },
            {
                "episode_id": episode_id,
                "start_s": 45.2,
                "end_s": 52.8,
                "text": "Isso é incrível! E qual foi o maior desafio que você enfrentou nessa jornada?",
                "confidence": 0.95,
            },
            {
                "episode_id": episode_id,
                "start_s": 52.8,
                "end_s": 68.5,
                "text": "Sem dúvida foi manter a motivação nos momentos difíceis. Teve vezes que pensei em desistir, mas a paixão pelo que faço sempre me trouxe de volta. O importante é ter uma visão clara e persistir.",
                "confidence": 0.93,
            },
            {
                "episode_id": episode_id,
                "start_s": 68.5,
                "end_s": 75.2,
                "text": "Você tem algum conselho para quem está começando agora?",
                "confidence": 0.96,
            },
            {
                "episode_id": episode_id,
                "start_s": 75.2,
                "end_s": 92.8,
                "text": "Sim! Primeiro, validem a ideia antes de investir muito tempo e dinheiro. Conversem com potenciais clientes, entendam o problema real. E segundo, construam uma rede forte de mentores e parceiros. Ninguém constrói nada sozinho.",
                "confidence": 0.94,
            },
            {
                "episode_id": episode_id,
                "start_s": 92.8,
                "end_s": 98.5,
                "text": "Excelente conselho! E sobre tecnologia, como você vê o futuro?",
                "confidence": 0.92,
            },
            {
                "episode_id": episode_id,
                "start_s": 98.5,
                "end_s": 115.3,
                "text": "A inteligência artificial vai revolucionar tudo. Já estamos vendo isso acontecer. As empresas que não se adaptarem vão ficar para trás. É fundamental estar sempre aprendendo e experimentando com novas tecnologias.",
                "confidence": 0.95,
            },
            {
                "episode_id": episode_id,
                "start_s": 115.3,
                "end_s": 122.7,
                "text": "Muito obrigado André pelas dicas valiosas! Pessoal, não esqueçam de se inscrever no canal!",
                "confidence": 0.96,
            },
            {
                "episode_id": episode_id,
                "start_s": 122.7,
                "end_s": 128.0,
                "text": "Obrigado vocês! Foi um prazer estar aqui. Até a próxima!",
                "confidence": 0.95,
            },
        ]
        
        segments_result = supabase.table("segments").insert(segments_data).execute()
        
        # Link segments to speakers (alternating between host and guest)
        segment_speakers_data = []
        for i, segment in enumerate(segments_result.data):
            # Odd segments are host (0), even segments are guest (1)
            speaker_label = "SPEAKER_00" if i % 2 == 0 else "SPEAKER_01"
            segment_speakers_data.append({
                "segment_id": segment["id"],
                "speaker_id": speakers[speaker_label],
            })
        
        supabase.table("segment_speakers").insert(segment_speakers_data).execute()
        
        # Create full transcript
        full_transcript = " ".join([s["text"] for s in segments_data])
        
        # Create mock highlights
        highlights_data = [
            {
                "episode_id": episode_id,
                "start_s": 28.7,
                "end_s": 45.2,
                "transcript": "Comecei muito cedo, na verdade. Aos 20 anos já tinha minha primeira empresa. Foi muito desafiador, mas aprendi que o segredo está em nunca desistir e sempre buscar aprender com os erros.",
                "status": "pending",
            },
            {
                "episode_id": episode_id,
                "start_s": 52.8,
                "end_s": 68.5,
                "transcript": "Sem dúvida foi manter a motivação nos momentos difíceis. Teve vezes que pensei em desistir, mas a paixão pelo que faço sempre me trouxe de volta. O importante é ter uma visão clara e persistir.",
                "status": "pending",
            },
            {
                "episode_id": episode_id,
                "start_s": 75.2,
                "end_s": 92.8,
                "transcript": "Primeiro, validem a ideia antes de investir muito tempo e dinheiro. Conversem com potenciais clientes, entendam o problema real. E segundo, construam uma rede forte de mentores e parceiros. Ninguém constrói nada sozinho.",
                "status": "pending",
            },
            {
                "episode_id": episode_id,
                "start_s": 98.5,
                "end_s": 115.3,
                "transcript": "A inteligência artificial vai revolucionar tudo. Já estamos vendo isso acontecer. As empresas que não se adaptarem vão ficar para trás.",
                "status": "pending",
            },
        ]
        
        supabase.table("highlights").insert(highlights_data).execute()
        
        # Update episode with transcript and status
        supabase.table("episodes").update({
            "full_transcript": full_transcript,
            "status": "completed",
            "duration_seconds": 128,
        }).eq("id", episode_id).execute()
        
        return {
            "message": "Mock data seeded successfully",
            "episode_id": episode_id,
            "segments_created": len(segments_data),
            "speakers_created": len(speakers_data),
            "highlights_created": len(highlights_data),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

