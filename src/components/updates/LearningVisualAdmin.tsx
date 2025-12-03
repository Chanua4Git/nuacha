import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Image, Loader2, Upload, Camera, Mic, Plus, Trash2, Eye, EyeOff, Timer } from 'lucide-react';
import { learningModules, type NarratorDisplayMode } from '@/constants/learningCenterData';
import { useLearningVisualGenerator } from '@/hooks/useLearningVisualGenerator';
import { 
  checkVisualExists, 
  uploadLearningVisual, 
  getLearningVisualUrl, 
  uploadNarratorVideo, 
  getNarratorVideoUrl, 
  checkNarratorExists,
  uploadLearningClip,
  getExistingClips,
  getNextClipIndex,
  deleteLearningClip,
  deleteLearningVisual,
  isClipActive,
  setClipActiveStatus
} from '@/utils/learningVisuals';
import { useModuleStatus, type ModuleStatus } from '@/hooks/useModuleStatus';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ScreenshotAnnotationEditor } from './ScreenshotAnnotationEditor';
import { CapturePreviewPanel } from './CapturePreviewPanel';
import { GifRecordingPanel } from './GifRecordingPanel';
import { GifEditor } from './GifEditor';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useVideoCompressor } from '@/hooks/useVideoCompressor';
import { VideoCompressionProgress } from './VideoCompressionProgress';
import { Dialog, DialogContent } from '@/components/ui/dialog';

type VisualStatus = 'exists' | 'missing' | 'generating' | 'uploading' | 'recording';
type VisualType = 'gif' | 'screenshot' | 'ai-generated' | 'missing';

interface ClipInfo {
  index: number;
  extension: string;
  url: string;
  isLegacy?: boolean;
  isActive?: boolean;
}

export function LearningVisualAdmin() {
  const { generateVisual, generateBatchVisuals, isGenerating } = useLearningVisualGenerator();
  const { compressVideo, isCompressing, progress, stage, estimateCompressedSize } = useVideoCompressor();
  const { statuses: moduleStatuses, setModuleStatus: updateModuleStatus, loading: statusLoading } = useModuleStatus();
  const [visualStatus, setVisualStatus] = useState<Map<string, VisualStatus>>(new Map());
  const [visualTypes, setVisualTypes] = useState<Map<string, VisualType>>(new Map());
  const [narratorStatus, setNarratorStatus] = useState<Map<string, boolean>>(new Map());
  const [narratorModes, setNarratorModes] = useState<Map<string, NarratorDisplayMode>>(new Map());
  const [narratorExtensions, setNarratorExtensions] = useState<Map<string, string>>(new Map());
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const narratorInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const clipInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  
  // Multi-clip tracking
  const [stepClips, setStepClips] = useState<Map<string, ClipInfo[]>>(new Map());
  const [loadingClips, setLoadingClips] = useState<Set<string>>(new Set());
  
  const [compressingNarrator, setCompressingNarrator] = useState<{
    key: string;
    originalSizeMB: number;
    stepTitle: string;
  } | null>(null);
  const [annotatingStep, setAnnotatingStep] = useState<{
    file: File;
    moduleId: string;
    stepId: string;
    stepTitle: string;
  } | null>(null);
  const [previewingStep, setPreviewingStep] = useState<{
    moduleId: string;
    stepId: string;
    stepTitle: string;
    targetPath: string;
    moduleTitle: string;
    moduleTrack: string;
    stepDescription: string;
    screenshotHint?: string;
    detailedInstructions?: string;
    stepNumber: number;
    totalSteps: number;
  } | null>(null);
  const [recordingStep, setRecordingStep] = useState<{
    moduleId: string;
    stepId: string;
    stepTitle: string;
    targetPath: string;
    moduleTitle: string;
    moduleTrack: string;
    stepDescription: string;
    screenshotHint?: string;
    detailedInstructions?: string;
    stepNumber: number;
    totalSteps: number;
  } | null>(null);
  const [editingGif, setEditingGif] = useState<{
    blob: Blob;
    moduleId: string;
    stepId: string;
    stepTitle: string;
  } | null>(null);

  // Check which visuals already exist
  useEffect(() => {
    checkAllVisualsExist();
    checkAllNarrators();
    loadAllClips();
  }, []);

  // Handle module status change
  const handleModuleStatusChange = async (moduleId: string, status: ModuleStatus) => {
    const success = await updateModuleStatus(moduleId, status);
    
    if (success) {
      const statusLabels = {
        'active': 'Active (visible to users)',
        'hidden': 'Hidden (invisible to users)',
        'coming-soon': 'Coming Soon (greyed out teaser)'
      };
      toast.success(`Module status set to: ${statusLabels[status]}`);
    } else {
      toast.error('Failed to update module status');
    }
  };

  // Load all clips for all steps with active status
  const loadAllClips = async () => {
    const clipsMap = new Map<string, ClipInfo[]>();
    
    for (const module of learningModules) {
      for (const step of module.steps) {
        const key = `${module.id}-${step.id}`;
        const clips = await getExistingClips(module.id, step.id);
        if (clips.length > 0) {
          // Add active status to each clip
          const clipsWithStatus = clips.map(clip => ({
            ...clip,
            isActive: isClipActive(module.id, step.id, clip.index)
          }));
          clipsMap.set(key, clipsWithStatus);
        }
      }
    }
    
    setStepClips(clipsMap);
  };

  // Load clips for a specific step with active status
  const loadClipsForStep = async (moduleId: string, stepId: string) => {
    const key = `${moduleId}-${stepId}`;
    setLoadingClips(prev => new Set(prev).add(key));
    
    const clips = await getExistingClips(moduleId, stepId);
    // Add active status to each clip
    const clipsWithStatus = clips.map(clip => ({
      ...clip,
      isActive: isClipActive(moduleId, stepId, clip.index)
    }));
    
    setStepClips(prev => {
      const next = new Map(prev);
      if (clipsWithStatus.length > 0) {
        next.set(key, clipsWithStatus);
      } else {
        next.delete(key);
      }
      return next;
    });
    
    setLoadingClips(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  // Toggle clip active status
  const handleToggleClipActive = (moduleId: string, stepId: string, clipIndex: number) => {
    const key = `${moduleId}-${stepId}`;
    const currentClips = stepClips.get(key) || [];
    const clip = currentClips.find(c => c.index === clipIndex);
    
    if (!clip) return;
    
    const newActive = !clip.isActive;
    setClipActiveStatus(`${moduleId}/${stepId}_${clipIndex}`, newActive);
    
    // Update local state
    setStepClips(prev => {
      const next = new Map(prev);
      const clips = next.get(key) || [];
      next.set(key, clips.map(c => 
        c.index === clipIndex ? { ...c, isActive: newActive } : c
      ));
      return next;
    });
    
    toast.success(newActive ? 'Clip activated' : 'Clip hidden from users');
  };

  // Delete legacy clip
  const handleDeleteLegacyClip = async (
    moduleId: string,
    stepId: string,
    extension: string,
    stepTitle: string
  ) => {
    const confirmed = window.confirm(`Delete legacy clip from "${stepTitle}"?`);
    if (!confirmed) return;

    try {
      const success = await deleteLearningVisual(moduleId, stepId, 'gif', extension);
      
      if (success) {
        await loadClipsForStep(moduleId, stepId);
        toast.success('Legacy clip deleted');
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Delete legacy clip error:', error);
      toast.error('Failed to delete clip. Please try again.');
    }
  };

  const checkAllVisualsExist = async () => {
    const statusMap = new Map<string, VisualStatus>();
    const typeMap = new Map<string, VisualType>();
    
    for (const module of learningModules) {
      for (const step of module.steps) {
        const key = `${module.id}-${step.id}`;
        
        // Check for indexed clips first (new multi-clip system)
        const clips = await getExistingClips(module.id, step.id);
        if (clips.length > 0) {
          statusMap.set(key, 'exists');
          typeMap.set(key, 'gif');
          continue;
        }
        
        // Check for legacy GIF (single file) - check both webm AND mp4
        const hasGifWebm = await checkVisualExists(module.id, step.id, 'gif', 'webm');
        const hasGifMp4 = await checkVisualExists(module.id, step.id, 'gif', 'mp4');
        
        if (hasGifWebm || hasGifMp4) {
          statusMap.set(key, 'exists');
          typeMap.set(key, 'gif');
          continue;
        }
        
        // Check for screenshot second
        const hasScreenshot = await checkVisualExists(module.id, step.id, 'screenshot');
        if (hasScreenshot) {
          statusMap.set(key, 'exists');
          typeMap.set(key, 'screenshot');
          continue;
        }
        
        // Check for AI-generated third
        const hasAI = await checkVisualExists(module.id, step.id, 'ai-generated');
        if (hasAI) {
          statusMap.set(key, 'exists');
          typeMap.set(key, 'ai-generated');
          continue;
        }
        
        // None exist
        statusMap.set(key, 'missing');
        typeMap.set(key, 'missing');
      }
    }
    
    setVisualStatus(statusMap);
    setVisualTypes(typeMap);
  };

  const checkAllNarrators = async () => {
    const narratorMap = new Map<string, boolean>();
    const extensionMap = new Map<string, string>();
    
    for (const module of learningModules) {
      for (const step of module.steps) {
        const key = `${module.id}-${step.id}`;
        const extension = await checkNarratorExists(module.id, step.id);
        
        if (extension) {
          narratorMap.set(key, true);
          extensionMap.set(key, extension);
        } else {
          narratorMap.set(key, false);
        }
        
        // Initialize narrator mode to default if not set
        if (!narratorModes.has(key)) {
          setNarratorModes(prev => new Map(prev).set(key, step.narrator?.displayMode || 'face-voice'));
        }
      }
    }
    
    setNarratorStatus(narratorMap);
    setNarratorExtensions(extensionMap);
  };

  const handleGenerateSingle = async (moduleId: string, stepId: string, title: string, description: string, screenshotHint?: string) => {
    const key = `${moduleId}-${stepId}`;
    
    // Update status to generating
    setVisualStatus(prev => new Map(prev).set(key, 'generating'));
    
    const url = await generateVisual({
      moduleId,
      stepId,
      title,
      description,
      screenshotHint
    });
    
    // Update status based on result
    if (url) {
      setVisualStatus(prev => new Map(prev).set(key, 'exists'));
      setVisualTypes(prev => new Map(prev).set(key, 'ai-generated'));
    } else {
      setVisualStatus(prev => new Map(prev).set(key, 'missing'));
    }
  };

  const handleFileSelect = (moduleId: string, stepId: string) => {
    const key = `${moduleId}-${stepId}`;
    const input = fileInputRefs.current.get(key);
    input?.click();
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    moduleId: string,
    stepId: string,
    stepTitle: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's a GIF
    const isGif = file.type === 'image/gif';
    const isImage = file.type.startsWith('image/') && !isGif;

    // Validate file type
    if (!isImage && !isGif) {
      toast.error('Invalid file type. Please upload an image file (PNG, JPG, WebP, GIF)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Please upload an image smaller than 5MB');
      return;
    }

    // For GIFs, upload directly without annotation
    if (isGif) {
      const key = `${moduleId}-${stepId}`;
      setVisualStatus(prev => new Map(prev).set(key, 'uploading'));
      setVisualTypes(prev => new Map(prev).set(key, 'gif'));
      
      try {
        await uploadLearningVisual(file, moduleId, stepId, 'gif');
        setVisualStatus(prev => new Map(prev).set(key, 'exists'));
        toast.success('GIF uploaded successfully!');
      } catch (error) {
        setVisualStatus(prev => new Map(prev).set(key, 'missing'));
        toast.error('Failed to upload GIF');
      }
      
      event.target.value = '';
      return;
    }

    // For images, open annotation editor
    setAnnotatingStep({ file, moduleId, stepId, stepTitle });

    // Reset input
    event.target.value = '';
  };

  const handleAnnotationSave = async (annotatedBlob: Blob) => {
    if (!annotatingStep) return;

    const { moduleId, stepId, stepTitle } = annotatingStep;
    const key = `${moduleId}-${stepId}`;
    
    setVisualStatus(prev => new Map(prev).set(key, 'uploading'));
    setAnnotatingStep(null);

    try {
      const url = await uploadLearningVisual(annotatedBlob, moduleId, stepId, 'screenshot');
      
      if (url) {
        setVisualStatus(prev => new Map(prev).set(key, 'exists'));
        setVisualTypes(prev => new Map(prev).set(key, 'screenshot'));
        toast.success(`Annotated screenshot saved for "${stepTitle}"`);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setVisualStatus(prev => new Map(prev).set(key, 'missing'));
      toast.error('Failed to upload screenshot. Please try again.');
    }
  };

  const handleCaptureFromPreview = (imageBlob: Blob) => {
    if (!previewingStep) return;

    // Convert blob to File for annotation editor
    const file = new File([imageBlob], `${previewingStep.stepId}-capture.png`, {
      type: 'image/png',
    });

    setAnnotatingStep({
      file,
      moduleId: previewingStep.moduleId,
      stepId: previewingStep.stepId,
      stepTitle: previewingStep.stepTitle,
    });

    setPreviewingStep(null);
  };

  const handleGifRecordingComplete = (gifBlob: Blob) => {
    console.log('=== handleGifRecordingComplete called ===');
    console.log('gifBlob:', gifBlob, 'size:', gifBlob?.size);
    console.log('recordingStep:', recordingStep);
    
    if (!recordingStep) {
      console.error('❌ recordingStep is null - returning early!');
      return;
    }

    console.log('✅ Setting editingGif state...');
    setEditingGif({
      blob: gifBlob,
      moduleId: recordingStep.moduleId,
      stepId: recordingStep.stepId,
      stepTitle: recordingStep.stepTitle,
    });

    console.log('✅ Setting recordingStep to null (closing recording panel)...');
    setRecordingStep(null);
  };

  const handleGifSave = async (editedBlob: Blob) => {
    if (!editingGif) return;

    const { moduleId, stepId, stepTitle } = editingGif;
    const key = `${moduleId}-${stepId}`;
    
    setVisualStatus(prev => new Map(prev).set(key, 'uploading'));
    setEditingGif(null);

    try {
      // Use indexed upload for multi-clip support
      const nextIndex = await getNextClipIndex(moduleId, stepId);
      const url = await uploadLearningClip(editedBlob, moduleId, stepId, nextIndex);
      
      if (url) {
        setVisualStatus(prev => new Map(prev).set(key, 'exists'));
        setVisualTypes(prev => new Map(prev).set(key, 'gif'));
        // Refresh clips for this step
        await loadClipsForStep(moduleId, stepId);
        toast.success(`Clip ${nextIndex} saved for "${stepTitle}"`);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setVisualStatus(prev => new Map(prev).set(key, 'missing'));
      toast.error('Failed to upload clip. Please try again.');
    }
  };

  // Handle adding a clip via file upload
  const handleAddClipFileSelect = (moduleId: string, stepId: string) => {
    const key = `${moduleId}-${stepId}`;
    const input = clipInputRefs.current.get(key);
    input?.click();
  };

  const handleAddClipUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    moduleId: string,
    stepId: string,
    stepTitle: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (video only)
    if (!file.type.startsWith('video/')) {
      toast.error('Invalid file type. Please upload a video file (MP4, WebM, MOV)');
      return;
    }

    const key = `${moduleId}-${stepId}`;
    const fileSizeMB = file.size / (1024 * 1024);
    const needsCompression = fileSizeMB >= 5;

    let videoToUpload: Blob = file;

    try {
      setVisualStatus(prev => new Map(prev).set(key, 'uploading'));

      // Compress if file is 5MB or larger
      if (needsCompression) {
        toast.info(`Video is ${fileSizeMB.toFixed(1)}MB. Compressing...`);
        videoToUpload = await compressVideo(file);
        
        const compressedSizeMB = videoToUpload.size / (1024 * 1024);
        if (compressedSizeMB >= 5) {
          toast.warning(`Compressed video is still ${compressedSizeMB.toFixed(1)}MB. Consider using a shorter video.`);
        }
      }

      // Upload as indexed clip
      const nextIndex = await getNextClipIndex(moduleId, stepId);
      const url = await uploadLearningClip(videoToUpload, moduleId, stepId, nextIndex);
      
      if (url) {
        setVisualStatus(prev => new Map(prev).set(key, 'exists'));
        setVisualTypes(prev => new Map(prev).set(key, 'gif'));
        await loadClipsForStep(moduleId, stepId);
        toast.success(`Clip ${nextIndex} added for "${stepTitle}"`);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Clip upload error:', error);
      toast.error('Failed to upload clip. Please try again.');
    }
    
    event.target.value = '';
  };

  // Handle deleting a specific clip
  const handleDeleteClip = async (
    moduleId: string,
    stepId: string,
    clipIndex: number,
    extension: string,
    stepTitle: string
  ) => {
    const key = `${moduleId}-${stepId}`;
    
    const confirmed = window.confirm(`Delete clip ${clipIndex} from "${stepTitle}"?`);
    if (!confirmed) return;

    try {
      const success = await deleteLearningClip(moduleId, stepId, clipIndex, extension);
      
      if (success) {
        await loadClipsForStep(moduleId, stepId);
        toast.success(`Clip ${clipIndex} deleted`);
        
        // Update visual status if no clips remain
        const remainingClips = stepClips.get(key) || [];
        if (remainingClips.length <= 1) {
          // Check if there are any other visuals
          const hasScreenshot = await checkVisualExists(moduleId, stepId, 'screenshot');
          const hasAI = await checkVisualExists(moduleId, stepId, 'ai-generated');
          
          if (!hasScreenshot && !hasAI) {
            setVisualStatus(prev => new Map(prev).set(key, 'missing'));
            setVisualTypes(prev => new Map(prev).set(key, 'missing'));
          }
        }
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Delete clip error:', error);
      toast.error('Failed to delete clip. Please try again.');
    }
  };

  const handleNarratorFileSelect = (moduleId: string, stepId: string) => {
    const key = `${moduleId}-${stepId}`;
    const input = narratorInputRefs.current.get(key);
    input?.click();
  };

  const handleNarratorUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    moduleId: string,
    stepId: string,
    stepTitle: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (video only)
    if (!file.type.startsWith('video/')) {
      toast.error('Invalid file type. Please upload a video file (MP4, WebM, MOV)');
      return;
    }

    const key = `${moduleId}-${stepId}`;
    const fileSizeMB = file.size / (1024 * 1024);
    const needsCompression = fileSizeMB >= 5;

    let videoToUpload: Blob = file;

    try {
      // Compress if file is 5MB or larger
      if (needsCompression) {
        setCompressingNarrator({
          key,
          originalSizeMB: fileSizeMB,
          stepTitle
        });

        toast.info(`Video is ${fileSizeMB.toFixed(1)}MB. Compressing...`);
        videoToUpload = await compressVideo(file);

        // Check compressed size
        const compressedSizeMB = videoToUpload.size / (1024 * 1024);
        if (compressedSizeMB >= 5) {
          toast.warning(`Compressed video is still ${compressedSizeMB.toFixed(1)}MB. Consider using a shorter video.`);
        }

        setCompressingNarrator(null);
      }

      // Upload the video (compressed or original)
      const url = await uploadNarratorVideo(videoToUpload, moduleId, stepId);
      
      if (url) {
        setNarratorStatus(prev => new Map(prev).set(key, true));
        setNarratorExtensions(prev => new Map(prev).set(key, 'mp4'));
        
        if (needsCompression) {
          toast.success(`Narrator video compressed and uploaded for "${stepTitle}"`);
        } else {
          toast.success(`Narrator video uploaded for "${stepTitle}"`);
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Narrator upload error:', error);
      toast.error('Failed to upload narrator video. Please try again.');
      setCompressingNarrator(null);
    }
    
    event.target.value = '';
  };

  const handleNarratorModeChange = (moduleId: string, stepId: string, mode: NarratorDisplayMode) => {
    const key = `${moduleId}-${stepId}`;
    setNarratorModes(prev => new Map(prev).set(key, mode));
    // In a real app, this would save to database/storage
    toast.success(`Narrator display mode set to: ${mode}`);
  };

  const handleGenerateModule = async (moduleId: string) => {
    const module = learningModules.find(m => m.id === moduleId);
    if (!module) return;

    // Mark all steps in module as generating
    const updatedStatus = new Map(visualStatus);
    module.steps.forEach(step => {
      const key = `${moduleId}-${step.id}`;
      if (visualStatus.get(key) !== 'exists') {
        updatedStatus.set(key, 'generating');
      }
    });
    setVisualStatus(updatedStatus);

    // Generate missing visuals for this module
    const stepsToGenerate = module.steps
      .filter(step => visualStatus.get(`${moduleId}-${step.id}`) !== 'exists')
      .map(step => ({
        moduleId,
        stepId: step.id,
        step
      }));

    const results = await generateBatchVisuals(stepsToGenerate);

    // Update status based on results
    const finalStatus = new Map(visualStatus);
    stepsToGenerate.forEach(step => {
      const key = `${step.moduleId}-${step.stepId}`;
      const url = results.get(key);
      finalStatus.set(key, url ? 'exists' : 'missing');
    });
    setVisualStatus(finalStatus);
  };

  const handleGenerateAllMissing = async () => {
    const allMissingSteps = learningModules.flatMap(module =>
      module.steps
        .filter(step => visualStatus.get(`${module.id}-${step.id}`) !== 'exists')
        .map(step => ({
          moduleId: module.id,
          stepId: step.id,
          step
        }))
    );

    if (allMissingSteps.length === 0) {
      toast.success('All visuals already exist!');
      return;
    }

    // Mark all as generating
    const updatedStatus = new Map(visualStatus);
    allMissingSteps.forEach(step => {
      updatedStatus.set(`${step.moduleId}-${step.stepId}`, 'generating');
    });
    setVisualStatus(updatedStatus);

    const results = await generateBatchVisuals(allMissingSteps, (current, total) => {
      toast.info(`Generating visuals: ${current}/${total}`);
    });

    // Update final status
    const finalStatus = new Map(visualStatus);
    allMissingSteps.forEach(step => {
      const key = `${step.moduleId}-${step.stepId}`;
      const url = results.get(key);
      finalStatus.set(key, url ? 'exists' : 'missing');
    });
    setVisualStatus(finalStatus);
  };

  const toggleModule = (moduleId: string) => {
    setOpenModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const missingCount = Array.from(visualStatus.values()).filter(s => s === 'missing').length;
  const totalCount = learningModules.reduce((acc, m) => acc + m.steps.length, 0);
  const existsCount = Array.from(visualStatus.values()).filter(s => s === 'exists').length;

  return (
    <div className="space-y-6">
      {/* Header with bulk action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Image className="w-6 h-6" />
            Learning Visual Generator
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {existsCount}/{totalCount} visuals generated • {missingCount} missing
          </p>
        </div>
        <Button 
          onClick={handleGenerateAllMissing} 
          disabled={isGenerating || missingCount === 0}
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              Generate All Missing ({missingCount})
            </>
          )}
        </Button>
      </div>

      {/* Module list */}
      <div className="space-y-4">
        {learningModules.map(module => {
          const moduleStepsTotal = module.steps.length;
          const moduleStepsExists = module.steps.filter(
            step => visualStatus.get(`${module.id}-${step.id}`) === 'exists'
          ).length;
          const isOpen = openModules.has(module.id);

          const currentStatus = moduleStatuses[module.id] || 'active';
          
          return (
            <Card key={module.id}>
              <Collapsible open={isOpen} onOpenChange={() => toggleModule(module.id)}>
                <CardHeader className="cursor-pointer" onClick={() => toggleModule(module.id)}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ChevronDown 
                              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                            />
                          </Button>
                        </CollapsibleTrigger>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{module.title}</h3>
                            {currentStatus === 'hidden' && (
                              <Badge variant="outline" className="text-xs gap-1 bg-destructive/10 text-destructive border-destructive/30">
                                <EyeOff className="w-3 h-3" />
                                Hidden
                              </Badge>
                            )}
                            {currentStatus === 'coming-soon' && (
                              <Badge variant="outline" className="text-xs gap-1 bg-amber-100 text-amber-800 border-amber-300">
                                <Timer className="w-3 h-3" />
                                Coming Soon
                              </Badge>
                            )}
                            {currentStatus === 'active' && (
                              <Badge variant="outline" className="text-xs gap-1 bg-green-100 text-green-800 border-green-300">
                                <Eye className="w-3 h-3" />
                                Active
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {moduleStepsExists}/{moduleStepsTotal} steps completed
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Module Status Selector */}
                    <Select
                      value={currentStatus}
                      onValueChange={(value: ModuleStatus) => handleModuleStatusChange(module.id, value)}
                    >
                      <SelectTrigger 
                        className="w-[140px]" 
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-green-600" />
                            Active
                          </div>
                        </SelectItem>
                        <SelectItem value="hidden">
                          <div className="flex items-center gap-2">
                            <EyeOff className="w-4 h-4 text-destructive" />
                            Hidden
                          </div>
                        </SelectItem>
                        <SelectItem value="coming-soon">
                          <div className="flex items-center gap-2">
                            <Timer className="w-4 h-4 text-amber-600" />
                            Coming Soon
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateModule(module.id);
                      }}
                      disabled={isGenerating || moduleStepsExists === moduleStepsTotal}
                      className="gap-2"
                    >
                      Generate Module
                    </Button>
                  </div>
                </CardHeader>

                <CollapsibleContent>
                  <CardContent>
                    {module.steps.map((step, idx) => {
                      const key = `${module.id}-${step.id}`;
                      const status = visualStatus.get(key) || 'missing';
                      const type = visualTypes.get(key) || 'missing';
                      const isProcessing = status === 'generating' || status === 'uploading';
                      const hasNarrator = narratorStatus.get(key) || false;
                      const narratorMode = narratorModes.get(key) || 'face-voice';

                      return (
                        <div 
                          key={step.id} 
                          className="py-4 border-b last:border-0 space-y-3"
                        >
                          {/* Step Header with Visual Status */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="text-sm font-medium">
                                {idx + 1}. {step.title}
                              </span>
                              {/* Preview thumbnail for existing visuals */}
                              {status === 'exists' && (
                                <HoverCard>
                                  <HoverCardTrigger asChild>
                                  {type === 'gif' ? (
                                    <video
                                      src={getLearningVisualUrl(module.id, step.id, 'gif', 'mp4')}
                                      autoPlay
                                      loop
                                      muted
                                      playsInline
                                      className="h-8 w-12 object-cover rounded border border-border cursor-pointer"
                                      onError={(e) => {
                                        // Fallback to webm if mp4 fails
                                        const target = e.target as HTMLVideoElement;
                                        if (!target.src.endsWith('.webm')) {
                                          target.src = getLearningVisualUrl(module.id, step.id, 'gif', 'webm');
                                        }
                                      }}
                                    />
                                  ) : (
                                    <img 
                                      src={getLearningVisualUrl(
                                        module.id, 
                                        step.id, 
                                        type === 'missing' ? 'ai-generated' : type,
                                        'png'
                                      )}
                                      alt={`${step.title} preview`}
                                      className="h-8 w-12 object-cover rounded border border-border cursor-pointer"
                                    />
                                  )}
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80 p-2" side="right">
                                  {type === 'gif' ? (
                                    <video
                                      src={getLearningVisualUrl(module.id, step.id, 'gif', 'mp4')}
                                      autoPlay
                                      loop
                                      muted
                                      playsInline
                                      className="w-full rounded"
                                      onError={(e) => {
                                        const target = e.target as HTMLVideoElement;
                                        if (!target.src.endsWith('.webm')) {
                                          target.src = getLearningVisualUrl(module.id, step.id, 'gif', 'webm');
                                        }
                                      }}
                                    />
                                  ) : (
                                    <img 
                                      src={getLearningVisualUrl(
                                        module.id, 
                                        step.id, 
                                        type === 'missing' ? 'ai-generated' : type,
                                        'png'
                                      )}
                                      alt={`${step.title} full preview`}
                                      className="w-full rounded"
                                    />
                                  )}
                                  <p className="text-xs text-muted-foreground mt-2 text-center">
                                    {type === 'gif' ? '🎬 Animated GIF' : type === 'screenshot' ? '📸 Screenshot' : '🎨 AI Generated'}
                                  </p>
                                </HoverCardContent>
                              </HoverCard>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:ml-4">
                            <Badge 
                              variant={status === 'exists' ? 'default' : isProcessing ? 'secondary' : 'outline'}
                              className="gap-1"
                            >
                              {status === 'exists' && type === 'gif' && '🎬'}
                              {status === 'exists' && type === 'screenshot' && '📸'}
                              {status === 'exists' && type === 'ai-generated' && '🎨'}
                              {status === 'uploading' && <Loader2 className="w-3 h-3 animate-spin" />}
                              {status === 'generating' && <Loader2 className="w-3 h-3 animate-spin" />}
                              {status === 'recording' && <Loader2 className="w-3 h-3 animate-spin" />}
                              {status === 'missing' && '❌'}
                              <span className="capitalize">
                                {status === 'exists' ? type : status}
                              </span>
                            </Badge>
                             <input
                              ref={(el) => {
                                if (el) fileInputRefs.current.set(key, el);
                              }}
                              type="file"
                              accept="image/*,.gif"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, module.id, step.id, step.title)}
                            />
                            {step.ctaButton?.path && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => setRecordingStep({
                                  moduleId: module.id,
                                  stepId: step.id,
                                  stepTitle: step.title,
                                  targetPath: step.ctaButton!.path,
                                  moduleTitle: module.title,
                                  moduleTrack: module.track,
                                  stepDescription: step.description,
                                  screenshotHint: step.screenshotHint,
                                  detailedInstructions: step.detailedInstructions,
                                  stepNumber: idx + 1,
                                  totalSteps: module.steps.length,
                                })}
                                disabled={isProcessing}
                                className="gap-1"
                              >
                                <Camera className="w-3 h-3" />
                                🎬 Record GIF
                              </Button>
                            )}
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleFileSelect(module.id, step.id)}
                              disabled={isProcessing}
                              className="gap-1"
                            >
                              <Upload className="w-3 h-3" />
                              Upload
                            </Button>

                            {step.ctaButton?.path && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setPreviewingStep({
                                  moduleId: module.id,
                                  stepId: step.id,
                                  stepTitle: step.title,
                                  targetPath: step.ctaButton!.path,
                                  moduleTitle: module.title,
                                  moduleTrack: module.track,
                                  stepDescription: step.description,
                                  screenshotHint: step.screenshotHint,
                                  detailedInstructions: step.detailedInstructions,
                                  stepNumber: idx + 1,
                                  totalSteps: module.steps.length,
                                })}
                                disabled={isProcessing}
                                className="gap-1"
                              >
                                <Camera className="w-3 h-3" />
                                Preview
                              </Button>
                            )}
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleGenerateSingle(
                                module.id, 
                                step.id, 
                                step.title, 
                                step.description,
                                step.screenshotHint
                              )}
                              disabled={isProcessing}
                              className="gap-1"
                            >
                              <Image className="w-3 h-3" />
                              AI
                            </Button>
                          </div>
                        </div>

                        {/* Multi-Clip Section */}
                        {(() => {
                          const clips = stepClips.get(key) || [];
                          const isLoadingClipsForStep = loadingClips.has(key);
                          const clipCount = clips.length;
                          
                          return (
                            <div className="pl-8 bg-primary/5 rounded-lg p-3 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Camera className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">Video Clips</span>
                                  <Badge variant={clipCount > 0 ? 'default' : 'outline'} className="text-xs">
                                    {isLoadingClipsForStep ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      clipCount > 0 ? `📹 ${clipCount} clip${clipCount > 1 ? 's' : ''}` : '❌ No clips'
                                    )}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {/* Hidden file input for adding clips */}
                                  <input
                                    ref={(el) => {
                                      if (el) clipInputRefs.current.set(key, el);
                                    }}
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={(e) => handleAddClipUpload(e, module.id, step.id, step.title)}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAddClipFileSelect(module.id, step.id)}
                                    disabled={isProcessing}
                                    className="gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add Clip
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Clip Thumbnails */}
                              {clipCount > 0 && (
                                <div className="flex flex-wrap gap-3">
                                  {clips.map((clip) => (
                                    <div 
                                      key={`${clip.index}-${clip.extension}`}
                                      className={`relative group ${clip.isActive === false ? 'opacity-50' : ''}`}
                                    >
                                      <HoverCard>
                                        <HoverCardTrigger asChild>
                                          <video
                                            src={clip.url}
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            className="h-12 w-16 object-cover rounded border border-border cursor-pointer"
                                          />
                                        </HoverCardTrigger>
                                        <HoverCardContent className="w-80 p-2" side="top">
                                          <video
                                            src={clip.url}
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            className="w-full rounded"
                                          />
                                          <p className="text-xs text-muted-foreground mt-2 text-center">
                                            {clip.isLegacy ? 'Legacy Clip' : `Clip ${clip.index}`} • {clip.extension.toUpperCase()}
                                          </p>
                                        </HoverCardContent>
                                      </HoverCard>
                                      
                                      {/* Clip index badge with legacy indicator */}
                                      <span className={`absolute -top-1 -left-1 text-primary-foreground text-[10px] px-1 h-4 rounded-full flex items-center justify-center font-medium ${clip.isLegacy ? 'bg-amber-500' : 'bg-primary'}`}>
                                        {clip.isLegacy ? 'L' : clip.index}
                                      </span>
                                      
                                      {/* Active toggle button */}
                                      <Button
                                        size="icon"
                                        variant={clip.isActive !== false ? 'secondary' : 'outline'}
                                        className="absolute -bottom-1 -left-1 w-5 h-5"
                                        onClick={() => handleToggleClipActive(module.id, step.id, clip.index)}
                                        title={clip.isActive !== false ? 'Visible to users (click to hide)' : 'Hidden from users (click to show)'}
                                      >
                                        <span className="text-[10px]">{clip.isActive !== false ? '👁' : '🚫'}</span>
                                      </Button>
                                      
                                      {/* Delete button */}
                                      <Button
                                        size="icon"
                                        variant="destructive"
                                        className="absolute -top-1 -right-1 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => clip.isLegacy 
                                          ? handleDeleteLegacyClip(module.id, step.id, clip.extension, step.title)
                                          : handleDeleteClip(module.id, step.id, clip.index, clip.extension, step.title)
                                        }
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Legend for clip controls */}
                              {clipCount > 0 && (
                                <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground mt-2">
                                  <span><span className="bg-amber-500 text-white px-1 rounded">L</span> = Legacy clip</span>
                                  <span><span className="bg-primary text-primary-foreground px-1 rounded">1</span> = Indexed clip</span>
                                  <span>👁 = Visible to users</span>
                                  <span>🚫 = Hidden from users</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Narrator Section */}
                        <div className="pl-8 bg-muted/30 rounded-lg p-3 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Mic className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Narrator Video</span>
                              <Badge variant={hasNarrator ? 'default' : 'outline'} className="text-xs">
                                {hasNarrator ? '🎙️ Has Narrator' : '❌ No Narrator'}
                              </Badge>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                ref={(el) => {
                                  if (el) narratorInputRefs.current.set(key, el);
                                }}
                                type="file"
                                accept="video/*"
                                className="hidden"
                                onChange={(e) => handleNarratorUpload(e, module.id, step.id, step.title)}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleNarratorFileSelect(module.id, step.id)}
                                disabled={isProcessing}
                                className="gap-1"
                              >
                                <Upload className="w-3 h-3" />
                                Upload Narrator
                              </Button>
                              
                              {hasNarrator && (
                                <HoverCard>
                                  <HoverCardTrigger asChild>
                                    <video
                                      src={getNarratorVideoUrl(module.id, step.id, narratorExtensions.get(key) || 'webm')}
                                      muted
                                      playsInline
                                      className="h-8 w-12 object-cover rounded-full border border-border cursor-pointer"
                                    />
                                  </HoverCardTrigger>
                                  <HoverCardContent className="w-80 p-2" side="right">
                                    <video
                                      src={getNarratorVideoUrl(module.id, step.id, narratorExtensions.get(key) || 'webm')}
                                      autoPlay
                                      loop
                                      muted
                                      playsInline
                                      className="w-full rounded"
                                    />
                                    <p className="text-xs text-muted-foreground mt-2 text-center">
                                      🎙️ Narrator Video Preview
                                    </p>
                                  </HoverCardContent>
                                </HoverCard>
                              )}
                            </div>
                          </div>
                          
                          {hasNarrator && (
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Display Mode:</Label>
                              <RadioGroup
                                value={narratorMode}
                                onValueChange={(value) => handleNarratorModeChange(module.id, step.id, value as NarratorDisplayMode)}
                                className="flex flex-col sm:flex-row gap-2 sm:gap-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="face-voice" id={`${key}-face-voice`} />
                                  <Label htmlFor={`${key}-face-voice`} className="text-xs font-normal cursor-pointer">
                                    <span className="hidden sm:inline">Face + Voice (circular bubble)</span>
                                    <span className="sm:hidden">Face + Voice</span>
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="voice-only" id={`${key}-voice-only`} />
                                  <Label htmlFor={`${key}-voice-only`} className="text-xs font-normal cursor-pointer">
                                    <span className="hidden sm:inline">Voice Only (audio plays, no video)</span>
                                    <span className="sm:hidden">Voice Only</span>
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="disabled" id={`${key}-disabled`} />
                                  <Label htmlFor={`${key}-disabled`} className="text-xs font-normal cursor-pointer">
                                    Disabled
                                  </Label>
                                </div>
                              </RadioGroup>
                            </div>
                          )}
                        </div>
                      </div>
                      );
                    })}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {annotatingStep && (
        <ScreenshotAnnotationEditor
          imageFile={annotatingStep.file}
          moduleId={annotatingStep.moduleId}
          stepId={annotatingStep.stepId}
          stepTitle={annotatingStep.stepTitle}
          onSave={handleAnnotationSave}
          onCancel={() => setAnnotatingStep(null)}
        />
      )}

      {previewingStep && (
        <CapturePreviewPanel
          open={!!previewingStep}
          onClose={() => setPreviewingStep(null)}
          targetPath={previewingStep.targetPath}
          stepTitle={previewingStep.stepTitle}
          moduleTitle={previewingStep.moduleTitle}
          moduleTrack={previewingStep.moduleTrack}
          stepDescription={previewingStep.stepDescription}
          screenshotHint={previewingStep.screenshotHint}
          detailedInstructions={previewingStep.detailedInstructions}
          stepNumber={previewingStep.stepNumber}
          totalSteps={previewingStep.totalSteps}
          onCapture={handleCaptureFromPreview}
        />
      )}

      {recordingStep && (
        <GifRecordingPanel
          open={!!recordingStep}
          onClose={() => setRecordingStep(null)}
          targetPath={recordingStep.targetPath}
          stepTitle={recordingStep.stepTitle}
          moduleTitle={recordingStep.moduleTitle}
          moduleTrack={recordingStep.moduleTrack}
          stepDescription={recordingStep.stepDescription}
          screenshotHint={recordingStep.screenshotHint}
          detailedInstructions={recordingStep.detailedInstructions}
          stepNumber={recordingStep.stepNumber}
          totalSteps={recordingStep.totalSteps}
          onRecordingComplete={handleGifRecordingComplete}
        />
      )}

      {editingGif && (
        <GifEditor
          open={!!editingGif}
          gifBlob={editingGif.blob}
          onSave={handleGifSave}
          onCancel={() => setEditingGif(null)}
        />
      )}

      {compressingNarrator && (
        <Dialog open={true}>
          <DialogContent className="sm:max-w-md">
            <VideoCompressionProgress
              originalSizeMB={compressingNarrator.originalSizeMB}
              estimatedSizeMB={estimateCompressedSize(compressingNarrator.originalSizeMB)}
              progress={progress}
              stage={stage}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
