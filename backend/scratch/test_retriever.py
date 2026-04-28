import os
import asyncio
from retriever import get_retriever

async def test_retriever():
    retriever = get_retriever()
    query = "รายละเอียดบทเรียน Introduction to Computer Science"
    docs = await retriever.ainvoke(query)
    
    print(f"\nQuery: {query}")
    print("-" * 50)
    for i, doc in enumerate(docs):
        print(f"Chunk {i+1}:")
        print(doc.page_content)
        print("-" * 50)

if __name__ == "__main__":
    asyncio.run(test_retriever())
