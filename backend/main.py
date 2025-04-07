from typing import Union, List, Optional
from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import os
import uuid
import shutil
from enum import Enum
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

app = FastAPI()

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置为特定的前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 模型定义
class FileType(str, Enum):
    FOLDER = "folder"
    FILE = "file"

class FileItem(BaseModel):
    id: str
    name: str
    type: FileType
    updatedAt: datetime
    size: int
    parentId: Optional[str] = None

class CorpusTag(BaseModel):
    id: str
    name: str
    count: int

class Corpus(BaseModel):
    id: str
    title: str
    content: str
    tags: List[str]
    updatedAt: datetime

class KnowledgeBaseStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class KnowledgeBase(BaseModel):
    id: str
    name: str
    description: str
    status: KnowledgeBaseStatus
    documentCount: int
    updatedAt: datetime

class Stats(BaseModel):
    totalFiles: int
    totalCorpus: int
    totalRag: int

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: datetime

class CorpusCreate(BaseModel):
    title: str
    content: str
    tags: List[str]

class KnowledgeBaseCreate(BaseModel):
    name: str
    description: str
    sourceType: str
    selectedFiles: List[str]
    selectedCorpus: List[str]
    embeddingModel: str

# 示例数据
files_data = [
    # {"id": "1", "name": "项目文档", "type": "folder", "updatedAt": datetime.now(), "size": 0, "parentId": None},
    # {"id": "2", "name": "研究报告.pdf", "type": "file", "updatedAt": datetime.now(), "size": int(1024 * 1024 * 2.5), "parentId": None},
    # {"id": "3", "name": "会议记录.docx", "type": "file", "updatedAt": datetime.now(), "size": int(1024 * 500), "parentId": None},
    # {"id": "4", "name": "数据分析.xlsx", "type": "file", "updatedAt": datetime.now(), "size": int(1024 * 1024 * 1.2), "parentId": None},
    # {"id": "5", "name": "产品说明.pptx", "type": "file", "updatedAt": datetime.now(), "size": int(1024 * 1024 * 3.7), "parentId": None},
    # {"id": "6", "name": "子文件夹", "type": "folder", "updatedAt": datetime.now(), "size": 0, "parentId": "1"},
    # {"id": "7", "name": "技术规范.pdf", "type": "file", "updatedAt": datetime.now(), "size": int(1024 * 1024 * 1.8), "parentId": "1"},
    # {"id": "8", "name": "开发计划.docx", "type": "file", "updatedAt": datetime.now(), "size": int(1024 * 300), "parentId": "1"}
]

corpus_data = [
    {
        "id": "1",
        "title": "人工智能基础概念",
        "content": "人工智能（AI）是计算机科学的一个分支，致力于创建能够执行通常需要人类智能的任务的系统。这包括视觉感知、语音识别、决策制定和语言翻译等。",
        "tags": ["研究", "技术"],
        "updatedAt": datetime.now()
    },
    {
        "id": "2",
        "title": "机器学习算法比较",
        "content": "监督学习算法需要标记的训练数据，而无监督学习算法可以在没有标记的情况下工作。常见的监督学习算法包括线性回归、逻辑回归和支持向量机。无监督学习算法包括K均值聚类和主成分分析。",
        "tags": ["研究", "算法"],
        "updatedAt": datetime.now()
    },
    {
        "id": "3",
        "title": "深度学习框架概述",
        "content": "TensorFlow和PyTorch是两个最流行的深度学习框架。TensorFlow由Google开发，提供了强大的生产部署工具。PyTorch由Facebook开发，以其动态计算图和易用性而闻名。",
        "tags": ["技术", "工具"],
        "updatedAt": datetime.now()
    }
]

knowledge_bases_data = [
    {
        "id": "1",
        "name": "产品知识库",
        "description": "包含所有产品相关的文档、规格和使用说明",
        "status": "active",
        "documentCount": 24,
        "updatedAt": datetime.now()
    },
    {
        "id": "2",
        "name": "研究论文库",
        "description": "收集了领域内的重要研究论文和文献",
        "status": "active",
        "documentCount": 57,
        "updatedAt": datetime.now()
    },
    {
        "id": "3",
        "name": "技术文档库",
        "description": "技术规范、API文档和开发指南的集合",
        "status": "inactive",
        "documentCount": 18,
        "updatedAt": datetime.now()
    }
]

# 基础路由
@app.get("/")
def ReadRoot():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def ReadItem(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}

# 知识库统计接口
@app.get("/api/knowledge-base/stats", response_model=Stats)
def GetStats():
    return {
        "totalFiles": len(files_data),
        "totalCorpus": len(corpus_data),
        "totalRag": len(knowledge_bases_data)
    }

# 文件管理接口
@app.get("/api/knowledge-base/files", response_model=List[FileItem])
def GetFiles(parent_id: Optional[str] = None, search: Optional[str] = None):
    result_files = []
    
    # 基础目录
    base_dir = "data"
    
    # 确定当前目录路径
    current_dir = base_dir
    if parent_id:
        # 查找父文件夹的路径
        parent_folder = None
        for file in files_data:
            if file["id"] == parent_id:
                parent_folder = file
                break
        
        if parent_folder and "path" in parent_folder:
            current_dir = parent_folder["path"]
    
    # 检查目录是否存在
    if not os.path.exists(current_dir) or not os.path.isdir(current_dir):
        return []
    
    # 扫描当前目录
    for item in os.listdir(current_dir):
        item_path = os.path.join(current_dir, item)
        item_id = str(uuid.uuid4())
        
        # 检查是否已经有这个文件/文件夹的记录
        existing_item = None
        for file in files_data:
            if "path" in file and file["path"] == item_path:
                existing_item = file
                item_id = file["id"]  # 使用已存在的ID
                break
        
        if os.path.isfile(item_path):
            # 文件
            file_size = os.path.getsize(item_path)
            file_info = {
                "id": item_id,
                "name": item,
                "type": "file",
                "updatedAt": datetime.now(),
                "size": file_size,
                "path": item_path,
                "parentId": parent_id
            }
            
            if not existing_item:
                files_data.append(file_info)
            
            # 添加到结果
            result_files.append(file_info)
            
        elif os.path.isdir(item_path):
            # 文件夹
            folder_info = {
                "id": item_id,
                "name": item,
                "type": "folder",
                "updatedAt": datetime.now(),
                "size": 0,
                "path": item_path,
                "parentId": parent_id
            }
            
            if not existing_item:
                files_data.append(folder_info)
            
            # 添加到结果
            result_files.append(folder_info)
    
    # 过滤搜索结果
    if search:
        search = search.lower()
        result_files = [file for file in result_files if search in file["name"].lower()]
    
    return result_files

@app.post("/api/knowledge-base/upload")
async def UploadFile(file: UploadFile = File(...), parent_id: Optional[str] = Form(None)):
    # 在实际应用中，这里应该保存文件到磁盘或云存储
    file_id = str(uuid.uuid4())
    file_size = 0
    
    # 计算文件大小
    content = await file.read()
    file_size = len(content)
    
    # 重置文件指针
    await file.seek(0)
    
    # 保存文件到 @/data 目录
    upload_dir = "data"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 添加到文件列表
    new_file = {
        "id": file_id,
        "name": file.filename,
        "type": "file",
        "updatedAt": datetime.now(),
        "size": file_size,
        "parentId": parent_id
    }
    files_data.append(new_file)
    
    return new_file

@app.post("/api/knowledge-base/folders")
def CreateFolder(name: str = Form(...), parent_id: Optional[str] = Form(None)):
    folder_id = str(uuid.uuid4())
    
    # 确定父文件夹路径
    parent_path = "data"  # 默认为根目录
    
    if parent_id:
        # 查找父文件夹
        for file in files_data:
            if file["id"] == parent_id and file["type"] == "folder":
                if "path" in file:
                    parent_path = file["path"]
                break
    
    # 创建实际文件夹路径
    folder_path = os.path.join(parent_path, name)
    
    # 检查文件夹是否已存在
    if os.path.exists(folder_path):
        raise HTTPException(status_code=400, detail="文件夹已存在")
    
    # 创建文件夹
    os.makedirs(folder_path, exist_ok=True)
    print(f"创建文件夹: {folder_path}")
    
    # 添加到文件列表
    new_folder = {
        "id": folder_id,
        "name": name,
        "type": "folder",
        "updatedAt": datetime.now(),
        "size": 0,
        "parentId": parent_id,
        "path": folder_path
    }
    files_data.append(new_folder)
    return new_folder

@app.put("/api/knowledge-base/files/{file_id}")
def RenameFile(file_id: str, name: str = Form(...)):
    for file in files_data:
        if file["id"] == file_id:
            # 保存旧文件名
            old_name = file["name"]
            
            # 更新文件对象
            file["name"] = name
            file["updatedAt"] = datetime.now()
            
            # 如果是实际文件，还需要重命名文件系统中的文件
            if file["type"] == "file":
                old_path = os.path.join("data", old_name)  # 使用旧文件名
                new_path = os.path.join("data", name)
                
                # 检查文件是否存在
                if os.path.exists(old_path):
                    # 重命名文件
                    os.rename(old_path, new_path)
                    print(f"文件重命名: {old_path} -> {new_path}")
                else:
                    print(f"文件不存在: {old_path}")
            
            return file
    raise HTTPException(status_code=404, detail="文件未找到")

@app.delete("/api/knowledge-base/files/{file_id}")
def DeleteFile(file_id: str):
    global files_data
    
    # 打印当前文件列表中的所有ID，帮助调试
    print(f"正在尝试删除文件ID: {file_id}")
    print(f"当前文件列表中的ID: {[f['id'] for f in files_data]}")
    
    # 先尝试在内存中查找文件
    file_to_delete = None
    for i, file in enumerate(files_data):
        if file["id"] == file_id:
            file_to_delete = file
            files_data.pop(i)
            break
    
    # 如果在内存中找不到，可能是因为文件列表被重新加载了
    # 尝试从文件系统中查找并删除
    if not file_to_delete:
        # 重新加载文件列表
        all_files = []
        for root, dirs, files in os.walk("data"):
            for name in files:
                file_path = os.path.join(root, name)
                all_files.append({
                    "id": file_id,  # 使用传入的ID
                    "name": name,
                    "path": file_path,
                    "type": "file"
                })
        
        # 尝试删除文件
        for file in all_files:
            if os.path.exists(file["path"]):
                try:
                    os.remove(file["path"])
                    print(f"文件已删除: {file['path']}")
                    return {"success": True}
                except Exception as e:
                    print(f"删除文件失败: {file['path']}, 错误: {str(e)}")
        
        # 如果还是找不到，返回404
        raise HTTPException(status_code=404, detail="文件未找到")
    
    # 如果在内存中找到了文件
    # 如果是文件，删除实际文件
    if file_to_delete["type"] == "file":
        # 使用文件的完整路径
        file_path = file_to_delete.get("path")
        if not file_path:
            # 尝试构建路径
            parent_id = file_to_delete.get("parentId")
            if parent_id:
                # 查找父文件夹
                parent_folder = None
                for f in files_data:
                    if f["id"] == parent_id:
                        parent_folder = f
                        break
                
                if parent_folder and "path" in parent_folder:
                    file_path = os.path.join(parent_folder["path"], file_to_delete["name"])
            else:
                # 默认路径
                file_path = os.path.join("data", file_to_delete["name"])
        
        # 删除文件
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
            print(f"文件已删除: {file_path}")
        else:
            print(f"文件不存在或路径未知: {file_to_delete}")
    
    # 如果是文件夹，删除文件夹及其内容
    elif file_to_delete["type"] == "folder":
        folder_path = file_to_delete.get("path")
        if folder_path and os.path.exists(folder_path):
            try:
                shutil.rmtree(folder_path)
                print(f"文件夹已删除: {folder_path}")
            except Exception as e:
                print(f"删除文件夹失败: {folder_path}, 错误: {str(e)}")
        
        # 从内存中删除子文件
        files_data = [f for f in files_data if f.get("parentId") != file_id]
    
    return {"success": True}

@app.get("/api/knowledge-base/files/{file_id}/download")
def DownloadFile(file_id: str):
    # 查找文件
    file = None
    for f in files_data:
        if f["id"] == file_id:
            file = f
            break
    
    if not file:
        raise HTTPException(status_code=404, detail="文件未找到")
    
    # 从 data 目录获取文件
    file_path = os.path.join("data", file["name"])
    
    # 检查文件是否存在
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="文件不存在于服务器上")
    
    # 返回文件响应
    return FileResponse(
        path=file_path,
        filename=file["name"],
        media_type="application/octet-stream"
    )

@app.put("/api/knowledge-base/files/{file_id}/move")
def MoveFile(file_id: str, parent_id: str = Form(...)):
    # 查找文件
    file_to_move = None
    for file in files_data:
        if file["id"] == file_id:
            file_to_move = file
            break
    
    if not file_to_move:
        raise HTTPException(status_code=404, detail="文件未找到")
    
    # 查找目标文件夹
    target_folder = None
    for file in files_data:
        if file["id"] == parent_id and file["type"] == "folder":
            target_folder = file
            break
    
    if not target_folder:
        raise HTTPException(status_code=404, detail="目标文件夹未找到")
    
    # 如果是文件，需要移动实际文件
    if file_to_move["type"] == "file":
        # 使用完整路径而不是假设文件在根目录
        old_path = file_to_move.get("path")
        if not old_path:
            old_path = os.path.join("data", file_to_move["name"])
            
        # 确保目标文件夹路径存在
        target_path = target_folder.get("path")
        if not target_path:
            target_path = os.path.join("data", target_folder["name"])
            
        new_path = os.path.join(target_path, file_to_move["name"])
        
        # 检查文件是否存在
        if os.path.exists(old_path):
            # 确保目标文件夹存在
            os.makedirs(target_path, exist_ok=True)
            # 移动文件
            shutil.move(old_path, new_path)
            print(f"文件已移动: {old_path} -> {new_path}")
            
            # 更新文件的路径
            file_to_move["path"] = new_path
        else:
            print(f"文件不存在: {old_path}")
    
    # 更新文件的父文件夹ID
    file_to_move["parentId"] = parent_id
    file_to_move["updatedAt"] = datetime.now()
    
    return file_to_move

# 语料管理接口
@app.get("/api/knowledge-base/corpus", response_model=List[Corpus])
def GetCorpus(tag: Optional[str] = None, search: Optional[str] = None):
    filtered_corpus = corpus_data
    
    if tag:
        filtered_corpus = [item for item in filtered_corpus if tag in item["tags"]]
    
    if search:
        search = search.lower()
        filtered_corpus = [
            item for item in filtered_corpus 
            if search in item["title"].lower() or search in item["content"].lower()
        ]
    
    return filtered_corpus

@app.get("/api/knowledge-base/corpus/tags", response_model=List[CorpusTag])
def GetCorpusTags():
    tag_counts = {}
    for corpus in corpus_data:
        for tag in corpus["tags"]:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
    
    return [{"id": tag, "name": tag, "count": count} for tag, count in tag_counts.items()]

@app.post("/api/knowledge-base/corpus", response_model=Corpus)
def CreateCorpus(corpus: CorpusCreate):
    corpus_id = str(uuid.uuid4())
    new_corpus = {
        "id": corpus_id,
        "title": corpus.title,
        "content": corpus.content,
        "tags": corpus.tags,
        "updatedAt": datetime.now()
    }
    corpus_data.append(new_corpus)
    return new_corpus

@app.put("/api/knowledge-base/corpus/{corpus_id}", response_model=Corpus)
def UpdateCorpus(corpus_id: str, corpus: CorpusCreate):
    for item in corpus_data:
        if item["id"] == corpus_id:
            item["title"] = corpus.title
            item["content"] = corpus.content
            item["tags"] = corpus.tags
            item["updatedAt"] = datetime.now()
            return item
    raise HTTPException(status_code=404, detail="语料未找到")

@app.delete("/api/knowledge-base/corpus/{corpus_id}")
def DeleteCorpus(corpus_id: str):
    global corpus_data
    for i, corpus in enumerate(corpus_data):
        if corpus["id"] == corpus_id:
            corpus_data.pop(i)
            return {"success": True}
    raise HTTPException(status_code=404, detail="语料未找到")

# RAG知识库接口
@app.get("/api/knowledge-base/rag", response_model=List[KnowledgeBase])
def GetRagKnowledgeBases(search: Optional[str] = None):
    filtered_kbs = knowledge_bases_data
    
    if search:
        search = search.lower()
        filtered_kbs = [
            kb for kb in filtered_kbs 
            if search in kb["name"].lower() or search in kb["description"].lower()
        ]
    
    return filtered_kbs

@app.post("/api/knowledge-base/rag", response_model=KnowledgeBase)
def CreateRagKnowledgeBase(kb: KnowledgeBaseCreate):
    kb_id = str(uuid.uuid4())
    
    # 计算文档数量
    doc_count = len(kb.selectedFiles) + len(kb.selectedCorpus)
    
    new_kb = {
        "id": kb_id,
        "name": kb.name,
        "description": kb.description,
        "status": "inactive",  # 默认为未激活
        "documentCount": doc_count,
        "updatedAt": datetime.now()
    }
    knowledge_bases_data.append(new_kb)
    return new_kb

@app.put("/api/knowledge-base/rag/{kb_id}", response_model=KnowledgeBase)
def UpdateRagKnowledgeBase(kb_id: str, kb: KnowledgeBaseCreate):
    for item in knowledge_bases_data:
        if item["id"] == kb_id:
            # 计算文档数量
            doc_count = len(kb.selectedFiles) + len(kb.selectedCorpus)
            
            item["name"] = kb.name
            item["description"] = kb.description
            item["documentCount"] = doc_count
            item["updatedAt"] = datetime.now()
            return item
    raise HTTPException(status_code=404, detail="知识库未找到")

@app.put("/api/knowledge-base/rag/{kb_id}/status")
def UpdateRagKnowledgeBaseStatus(kb_id: str, status: KnowledgeBaseStatus):
    for item in knowledge_bases_data:
        if item["id"] == kb_id:
            item["status"] = status
            item["updatedAt"] = datetime.now()
            return {"success": True}
    raise HTTPException(status_code=404, detail="知识库未找到")

@app.delete("/api/knowledge-base/rag/{kb_id}")
def DeleteRagKnowledgeBase(kb_id: str):
    global knowledge_bases_data
    for i, kb in enumerate(knowledge_bases_data):
        if kb["id"] == kb_id:
            knowledge_bases_data.pop(i)
            return {"success": True}
    raise HTTPException(status_code=404, detail="知识库未找到")

# RAG聊天接口
@app.post("/api/knowledge-base/rag/{kb_id}/chat", response_model=ChatMessage)
def ChatWithRag(kb_id: str, message: str = Form(...)):
    # 查找知识库
    kb = None
    for item in knowledge_bases_data:
        if item["id"] == kb_id:
            kb = item
            break
    
    if not kb:
        raise HTTPException(status_code=404, detail="知识库未找到")
    
    # 模拟RAG回答
    response = f"基于\"{kb['name']}\"知识库，对于您的问题\"{message}\"，我找到了以下信息：\n\n这是一个基于RAG（检索增强生成）的回答示例。在实际应用中，这里会返回从知识库中检索到的相关信息，并生成针对用户问题的回答。"
    
    return {
        "role": "assistant",
        "content": response,
        "timestamp": datetime.now()
    }