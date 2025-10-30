"""Mock data service for development without ML models."""
import random
from typing import List, Dict, Any


class MockDataService:
    """Service for generating mock transcription and highlights."""

    SAMPLE_SENTENCES = [
        "Olá pessoal, bem-vindos ao nosso podcast de hoje.",
        "Hoje vamos falar sobre empreendedorismo e inovação.",
        "É muito importante ter uma visão clara do seu negócio.",
        "Concordo totalmente, a execução é fundamental.",
        "Uma das coisas que aprendi ao longo dos anos é que consistência vence talento.",
        "Exatamente, você precisa estar disposto a falhar e aprender.",
        "Deixa eu te contar uma história interessante sobre isso.",
        "Quando comecei minha primeira empresa, eu não tinha ideia do que estava fazendo.",
        "Mas o que me salvou foi ter mentorias e pessoas experientes ao redor.",
        "Isso é ouro, ter um mentor pode acelerar muito seu crescimento.",
        "E hoje, com as redes sociais, o alcance que você pode ter é incrível.",
        "Mas você precisa ser autêntico, as pessoas percebem quando não é genuíno.",
        "Falando em autenticidade, acho que isso é um dos maiores diferenciais.",
        "Concordo, e também é importante ter paciência com o processo.",
        "Muita gente desiste muito cedo, quando estava quase chegando lá.",
        "O mercado está mudando muito rápido, você precisa se adaptar constantemente.",
        "Tecnologia é uma ferramenta, não o objetivo final.",
        "No final do dia, é sobre resolver problemas reais das pessoas.",
        "E criar valor verdadeiro, não apenas hype.",
        "Perfeito, acho que resumiu muito bem o que discutimos hoje.",
    ]

    def generate_mock_transcript(self, duration_seconds: int) -> Dict[str, Any]:
        """
        Generate mock transcript with segments and speakers.
        
        Args:
            duration_seconds: Total duration of the episode
            
        Returns:
            Dictionary with segments and speakers
        """
        # Generate 2-3 speakers
        num_speakers = random.randint(2, 3)
        speakers = []
        
        speaker_names = ["André", "João", "Maria", "Pedro", "Ana"]
        for i in range(num_speakers):
            speakers.append({
                "speaker_label": f"SPEAKER_{i:02d}",
                "mapped_name": None,
            })
        
        # Generate segments (roughly every 5-8 seconds)
        segments = []
        current_time = 0.0
        segment_id = 0
        
        while current_time < duration_seconds - 10:
            segment_duration = random.uniform(4.0, 8.0)
            speaker_idx = random.randint(0, num_speakers - 1)
            
            segment = {
                "start_s": round(current_time, 2),
                "end_s": round(current_time + segment_duration, 2),
                "text": random.choice(self.SAMPLE_SENTENCES),
                "confidence": round(random.uniform(0.85, 0.98), 3),
                "speaker_label": f"SPEAKER_{speaker_idx:02d}",
            }
            
            segments.append(segment)
            current_time += segment_duration
            segment_id += 1
        
        # Build full transcript
        full_transcript = " ".join(seg["text"] for seg in segments)
        
        return {
            "segments": segments,
            "speakers": speakers,
            "full_transcript": full_transcript,
        }

    def generate_mock_highlights(
        self, segments: List[Dict[str, Any]], num_highlights: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Generate mock highlights from segments.
        
        Args:
            segments: List of transcript segments
            num_highlights: Number of highlights to generate
            
        Returns:
            List of highlight dictionaries
        """
        if len(segments) < num_highlights * 3:
            num_highlights = max(1, len(segments) // 3)
        
        highlights = []
        used_indices = set()
        
        highlight_types = [
            "Authority Moment",
            "Hook Quote",
            "Educational Segment",
            "Viral Moment",
            "Insight",
        ]
        
        for i in range(num_highlights):
            # Pick a random starting segment that hasn't been used
            available_indices = [j for j in range(len(segments) - 2) if j not in used_indices]
            if not available_indices:
                break
                
            start_idx = random.choice(available_indices)
            # Highlight spans 1-3 segments
            span = random.randint(1, 3)
            end_idx = min(start_idx + span, len(segments) - 1)
            
            # Mark these indices as used
            for idx in range(start_idx, end_idx + 1):
                used_indices.add(idx)
            
            # Build highlight
            start_s = segments[start_idx]["start_s"]
            end_s = segments[end_idx]["end_s"]
            transcript = " ".join(seg["text"] for seg in segments[start_idx:end_idx + 1])
            
            highlight = {
                "start_s": start_s,
                "end_s": end_s,
                "transcript": transcript,
                "status": random.choice(["pending", "pending", "pending", "used"]),  # Mostly pending
                "comments": f"Detected as: {random.choice(highlight_types)}",
            }
            
            highlights.append(highlight)
        
        return highlights

