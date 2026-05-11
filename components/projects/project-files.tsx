"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Upload,
  FileText,
  Image,
  FileSpreadsheet,
  File,
  MoreHorizontal,
  Download,
  Trash2,
  Search,
  FolderOpen,
} from "lucide-react"
import { format } from "date-fns"

interface ProjectFilesProps {
  projectId: string
}

// Mock data - in a real app, this would come from the database/storage
const MOCK_FILES = [
  {
    id: "1",
    name: "Literature Review.pdf",
    type: "pdf",
    size: 2450000,
    uploadedBy: "John Doe",
    uploadedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    name: "Research Data.xlsx",
    type: "spreadsheet",
    size: 150000,
    uploadedBy: "Jane Smith",
    uploadedAt: new Date("2024-01-18"),
  },
  {
    id: "3",
    name: "Survey Questions.docx",
    type: "document",
    size: 45000,
    uploadedBy: "John Doe",
    uploadedAt: new Date("2024-01-20"),
  },
  {
    id: "4",
    name: "Results Chart.png",
    type: "image",
    size: 350000,
    uploadedBy: "Jane Smith",
    uploadedAt: new Date("2024-01-22"),
  },
]

function getFileIcon(type: string) {
  switch (type) {
    case "pdf":
    case "document":
      return FileText
    case "image":
      return Image
    case "spreadsheet":
      return FileSpreadsheet
    default:
      return File
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

export function ProjectFiles({ projectId }: ProjectFilesProps) {
  const [files, setFiles] = useState(MOCK_FILES)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDragging, setIsDragging] = useState(false)

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    // Handle file upload
    const droppedFiles = Array.from(e.dataTransfer.files)
    console.log("Dropped files:", droppedFiles)
    // In a real app, upload to storage
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || [])
    console.log("Selected files:", selectedFiles)
    // In a real app, upload to storage
  }

  function handleDeleteFile(fileId: string) {
    setFiles(files.filter((f) => f.id !== fileId))
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Upload Files</h3>
          <p className="text-muted-foreground mb-4">
            Drag and drop files here, or click to browse
          </p>
          <div className="flex items-center justify-center gap-4">
            <Input
              type="file"
              multiple
              className="hidden"
              id="file-upload"
              onChange={handleFileSelect}
            />
            <Button asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                Browse Files
              </label>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Supported: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (Max 50MB)
          </p>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Project Files</CardTitle>
              <CardDescription>{files.length} files uploaded</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFiles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded by</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => {
                  const FileIcon = getFileIcon(file.type)
                  return (
                    <TableRow key={file.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileIcon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{file.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatFileSize(file.size)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{file.uploadedBy}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(file.uploadedAt, "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteFile(file.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {searchQuery ? "No files match your search" : "No files uploaded yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
