from typing import List, Dict
import openai
from ..core.config import settings
from ..models.document import SearchResult, WebSearchResult, AnswerResponse

class SynthesisService:
    def __init__(self):
        openai.api_key = settings.OPENAI_API_KEY
        self.model = settings.LLM_MODEL
    
    def _format_sources(self, pdf_results: List[SearchResult], web_results: List[WebSearchResult]) -> List[Dict[str, str]]:
        """Format sources for citation"""
        sources = []
        
        # Format PDF sources
        for i, result in enumerate(pdf_results):
            sources.append({
                "id": str(i + 1),
                "type": "pdf",
                "text": result.text[:200] + "...",  # Truncate for display
                "page": str(result.page_number),
                "document_id": result.source_id,
                "score": f"{result.score:.2f}"
            })
        
        # Format web sources
        for i, result in enumerate(web_results):
            sources.append({
                "id": str(len(pdf_results) + i + 1),
                "type": "web",
                "title": result.title,
                "url": result.url,
                "snippet": result.snippet,
                "date": result.published_date or "N/A",
                "score": f"{result.score:.2f}" if result.score else "N/A"
            })
        
        return sources
    
    def _create_prompt(self, query: str, pdf_results: List[SearchResult], web_results: List[WebSearchResult]) -> str:
        """Create prompt for the LLM"""
        prompt = f"Question: {query}\n\n"
        prompt += "Please provide a comprehensive answer based on the following sources. " \
                 "Cite sources using [n] notation.\n\n"
        
        prompt += "PDF Sources:\n"
        for i, result in enumerate(pdf_results):
            prompt += f"[{i+1}] (Page {result.page_number}): {result.text}\n\n"
        
        prompt += "Web Sources:\n"
        for i, result in enumerate(web_results):
            idx = len(pdf_results) + i + 1
            prompt += f"[{idx}] {result.title}\n{result.snippet}\n\n"
        
        prompt += "Instructions:\n" \
                 "1. Synthesize information from both PDF and web sources\n" \
                 "2. Use [n] citations to reference sources\n" \
                 "3. Prioritize recent and high-scoring sources\n" \
                 "4. Be concise but comprehensive\n" \
                 "5. If sources conflict, note the discrepancy\n\n" \
                 "Answer: "
        
        return prompt
    
    async def generate_answer(
        self,
        query: str,
        pdf_results: List[SearchResult],
        web_results: List[WebSearchResult]
    ) -> AnswerResponse:
        """Generate final answer with citations"""
        # Format sources for citations
        sources = self._format_sources(pdf_results, web_results)
        
        # Create prompt
        prompt = self._create_prompt(query, pdf_results, web_results)
        
        # Generate answer using OpenAI
        response = await openai.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a research assistant that provides accurate, "
                 "well-cited answers based on provided sources. Use [n] notation for citations."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1000
        )
        
        answer = response.choices[0].message.content
        
        # Calculate confidence score based on source quality
        total_score = sum(float(source["score"]) for source in sources 
                         if source["score"] != "N/A")
        avg_score = total_score / len(sources) if sources else 0
        
        return AnswerResponse(
            answer=answer,
            sources=sources,
            pdf_sources_used=len(pdf_results),
            web_sources_used=len(web_results),
            confidence_score=avg_score
        ) 