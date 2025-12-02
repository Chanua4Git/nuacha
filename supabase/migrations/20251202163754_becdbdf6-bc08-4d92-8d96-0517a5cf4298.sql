-- Delete old widescreen videos to make room for mobile upload
DELETE FROM storage.objects 
WHERE bucket_id = 'learning-visuals' 
AND name = 'gif/getting-started/step-1-1.webm';

DELETE FROM storage.objects 
WHERE bucket_id = 'learning-visuals' 
AND name = 'gif/getting-started/step-1-1.gif';