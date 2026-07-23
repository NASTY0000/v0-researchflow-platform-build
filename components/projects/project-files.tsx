"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Upload, FileText, ImageIcon, FileSpreadsheet, File,
  MoreHorizontal, Download, Trash2, Search, FolderOpen,
  History, ChevronDown, ChevronUp, RotateCcw, Loader2,
} from "lucide-react"
import { toast } from "sonner"

interface ProjectFile {
  id: string
  name: string
  url: string
  size: number
  file_type: string
  uploaded_by_id: string | null
  uploaded_by_name?: string
  created_at: string
  version: number
  parent_file_id: string | null
  is_latest: boolean
}

interface ProjectFilesProps {
  projectId: string
  currentUserId?: string | null
  isLead?: boolean
}

function getFileIcon(type: string) {
  if (type.includes('pdf') || type.includes('doc')) return FileText
  if (type.includes('image') || type.includes('png') || type.includes('jpg')) return ImageIcon
  if (type.includes('sheet') || type.includes('xls') || type.includes('csv')) return FileSpreadsheet
  return File
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function ProjectFiles({ projectId, currentUserId, isLead }: ProjectFilesProps) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [allVersions, setAllVersions] = useState<Record<string, ProjectFile[]>>({})
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Version conflict dialog
  const [versionDialog, setVersionDialog] = useState<{
    open: boolean
    file: File | null
    existingFile: ProjectFile | null
  }>({ open: false, file: null, existingFile: null })

  const supabase = createClient()

  useEffect(() => {
    loadFiles()
  }, [projectId])

  async function loadFiles() {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      // Fetch uploader names in a separate query — avoids FK relationship requirement
      const uploaderIds = [...new Set(
        data.map((f: any) => f.uploaded_by_id).filter(Boolean)
      )] as string[]
      let nameMap: Record<string, string> = {}
      if (uploaderIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', uploaderIds)
        nameMap = Object.fromEntries(
          (profileData || []).map((p: any) => [p.id, p.full_name || 'Unknown'])
        )
      }

      const mapped = data.map((f: any) => ({
        ...f,
        uploaded_by_name: nameMap[f.uploaded_by_id] || 'Unknown',
        is_latest: f.is_latest ?? true,
        version: f.version ?? 1,
      })) as ProjectFile[]

      setFiles(mapped.filter(f => f.is_latest))

      // Group all versions by parent_file_id (or id for originals)
      const versionMap: Record<string, ProjectFile[]> = {}
      for (const file of mapped) {
        if (!file.is_latest) {
          const key = file.parent_file_id || file.id
          if (!versionMap[key]) versionMap[key] = []
          versionMap[key].push(file)
        }
      }
      setAllVersions(versionMap)
    }
    setIsLoading(false)
  }

  async function handleFilesSelected(selectedFiles: File[]) {
    if (selectedFiles.length === 0) return
    for (const file of selectedFiles) {
      await processFileUpload(file)
    }
  }

  async function processFileUpload(file: File) {
    // Check for existing file with same name (latest version)
    const existing = files.find(f => f.name.toLowerCase() === file.name.toLowerCase())
    if (existing) {
      setVersionDialog({ open: true, file, existingFile: existing })
      return
    }
    await uploadFile(file, null, 1)
  }

  async function uploadFile(file: File, existingFile: ProjectFile | null, version: number) {
    setIsUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${projectId}/${Date.now()}-${file.name}`
      const { error: storageError } = await supabase.storage
        .from('project-files')
        .upload(path, file, { upsert: false })

      if (storageError) {
        console.error('Upload error:', JSON.stringify(storageError))
        toast.error(storageError.message || 'Upload failed')
        setIsUploading(false)
        return
      }

      const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(path)
      const publicUrl = urlData.publicUrl

      const { data: { user } } = await supabase.auth.getUser()

      if (existingFile) {
        // Mark old version as not latest
        await supabase.from('project_files').update({ is_latest: false }).eq('id', existingFile.id)
      }

      const parentId = existingFile?.parent_file_id || existingFile?.id || null

      const { data: newFile, error: dbError } = await supabase
        .from('project_files')
        .insert({
          project_id: projectId,
          name: file.name,
          url: publicUrl,
          size: file.size,
          file_type: file.type || ext || 'unknown',
          uploaded_by_id: user?.id || null,
          version,
          parent_file_id: parentId,
          is_latest: true,
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single()

      if (dbError) {
        console.error('Failed to save file record:', dbError)
        toast.error(dbError.message || 'Failed to save file record.')
      } else {
        toast.success(version > 1 ? `Uploaded v${version} of ${file.name}` : `${file.name} uploaded`)
        await loadFiles()
      }
    } catch (err) {
      toast.error('Upload error. Please try again.')
    }
    setIsUploading(false)
  }

  async function handleUploadAsVersion() {
    if (!versionDialog.file || !versionDialog.existingFile) return
    const newVersion = (versionDialog.existingFile.version || 1) + 1
    setVersionDialog({ open: false, file: null, existingFile: null })
    await uploadFile(versionDialog.file, versionDialog.existingFile, newVersion)
  }

  async function handleUploadAsNew() {
    if (!versionDialog.file) return
    const file = versionDialog.file
    setVersionDialog({ open: false, file: null, existingFile: null })
    await uploadFile(file, null, 1)
  }

  async function handleRestore(oldVersion: ProjectFile, currentLatest: ProjectFile) {
    // Mark current latest as not latest
    await supabase.from('project_files').update({ is_latest: false }).eq('id', currentLatest.id)
    // Mark old version as latest
    await supabase.from('project_files').update({ is_latest: true }).eq('id', oldVersion.id)
    toast.success(`Restored to v${oldVersion.version}`)
    await loadFiles()
  }

  async function handleDelete(file: ProjectFile) {
    await supabase.from('project_files').delete().eq('id', file.id)
    toast.success(`${file.name} deleted`)
    await loadFiles()
  }

  function toggleHistory(fileId: string) {
    setExpandedHistory(prev => ({ ...prev, [fileId]: !prev[fileId] }))
  }

  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Version conflict dialog */}
      <Dialog open={versionDialog.open} onOpenChange={(o) => !o && setVersionDialog({ open: false, file: null, existingFile: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File Already Exists</DialogTitle>
            <DialogDescription>
              A file named <strong>{versionDialog.file?.name}</strong> already exists (v{versionDialog.existingFile?.version}).
              How would you like to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleUploadAsNew}>Upload as New File</Button>
            <Button onClick={handleUploadAsVersion} style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none' }}>
              Upload as Version {(versionDialog.existingFile?.version || 1) + 1}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault(); setIsDragging(false)
          handleFilesSelected(Array.from(e.dataTransfer.files))
        }}
      >
        <CardContent className="p-8 text-center">
          {isUploading ? (
            <div className="space-y-3">
              <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
              <p className="text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Files</h3>
              <p className="text-muted-foreground mb-4">Drag and drop files here, or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelected(Array.from(e.target.files || []))}
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />Browse Files
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Supported: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (Max 50MB)
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Project Files</CardTitle>
              <CardDescription>{files.length} file{files.length !== 1 ? 's' : ''} uploaded</CardDescription>
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredFiles.length > 0 ? (
            <div className="space-y-2">
              {filteredFiles.map((file) => {
                const FileIcon = getFileIcon(file.file_type || file.name)
                const versions = allVersions[file.parent_file_id || file.id] || []
                const hasHistory = versions.length > 0
                const isExpanded = expandedHistory[file.id]
                return (
                  <div key={file.id} className="rounded-lg border border-border overflow-hidden">
                    {/* Main file row */}
                    <div className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <FileIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">{file.name}</span>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            v{file.version}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span>{formatFileSize(file.size)}</span>
                          <span>{file.uploaded_by_name}</span>
                          <span>{new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {hasHistory && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleHistory(file.id)}
                            className="text-xs text-muted-foreground h-7 gap-1"
                          >
                            <History className="h-3 w-3" />
                            History
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.open(file.url, '_blank')}>
                              <Download className="mr-2 h-4 w-4" />Download
                            </DropdownMenuItem>
                            {(isLead || file.uploaded_by_id === currentUserId) && (
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(file)}>
                                <Trash2 className="mr-2 h-4 w-4" />Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Version history panel */}
                    {isExpanded && hasHistory && (
                      <div className="border-t border-border bg-muted/30">
                        <div className="p-3 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">Version History</p>
                          {/* Current version */}
                          <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-primary/5 border border-primary/15">
                            <div className="text-sm">
                              <span className="font-medium">v{file.version}</span>
                              <span className="text-muted-foreground ml-2">(current)</span>
                              <span className="text-muted-foreground ml-2">· {file.uploaded_by_name}</span>
                              <span className="text-muted-foreground ml-2">· {new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => window.open(file.url, '_blank')} className="h-6 text-xs">
                              <Download className="h-3 w-3 mr-1" />Download
                            </Button>
                          </div>
                          {/* Old versions */}
                          {[...versions].sort((a, b) => b.version - a.version).map(v => (
                            <div key={v.id} className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted/50">
                              <div className="text-sm text-muted-foreground">
                                <span>v{v.version}</span>
                                <span className="ml-2">· {v.uploaded_by_name}</span>
                                <span className="ml-2">· {new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="ghost" onClick={() => window.open(v.url, '_blank')} className="h-6 text-xs">
                                  <Download className="h-3 w-3 mr-1" />Download
                                </Button>
                                {isLead && (
                                  <Button size="sm" variant="ghost" onClick={() => handleRestore(v, file)} className="h-6 text-xs text-primary">
                                    <RotateCcw className="h-3 w-3 mr-1" />Restore
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No files match your search' : 'No files uploaded yet'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
