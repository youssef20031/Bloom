import os
from langchain_community.document_loaders import DirectoryLoader, PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
# --- UPDATED IMPORT ---
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma


def build_and_save_vector_store():
    print("--- Starting One-Time Database Build ---")

    loader = DirectoryLoader(
        './', glob="*.pdf", loader_cls=PyPDFLoader,
        show_progress=True, use_multithreading=True
    )
    all_docs = loader.load()
    if not all_docs:
        print("No PDFs found. Exiting.")
        return

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=200)
    doc_splits = text_splitter.split_documents(all_docs)
    print(f"Split documents into {len(doc_splits)} chunks.")

    print("Initializing a free, local embedding model...")
    model_name = "sentence-transformers/all-MiniLM-L6-v2"
    embeddings = HuggingFaceEmbeddings(model_name=model_name)
    print("Local embedding model loaded successfully.")

    persist_directory = "chroma_db_persistent"

    print(f"Creating and persisting vector store to '{persist_directory}'...")
    Chroma.from_documents(
        documents=doc_splits,
        embedding=embeddings,
        persist_directory=persist_directory
    )

    print("--- Database Build Complete and Saved! ---")


if __name__ == "__main__":
    build_and_save_vector_store()