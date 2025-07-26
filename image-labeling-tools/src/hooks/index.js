import { useState, useEffect, useCallback, useRef } from 'react'
import { debounce, storage } from '../utils'

// 本地存储Hook
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    return storage.get(key, initialValue)
  })

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      storage.set(key, valueToStore)
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  return [storedValue, setValue]
}

// 防抖Hook
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// 异步操作Hook
export const useAsync = (asyncFunction, immediate = true) => {
  const [status, setStatus] = useState('idle')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    setStatus('pending')
    setData(null)
    setError(null)

    try {
      const response = await asyncFunction(...args)
      setData(response)
      setStatus('success')
      return response
    } catch (error) {
      setError(error)
      setStatus('error')
      throw error
    }
  }, [asyncFunction])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return {
    execute,
    status,
    data,
    error,
    isLoading: status === 'pending',
    isError: status === 'error',
    isSuccess: status === 'success'
  }
}

// 文件上传Hook
export const useFileUpload = () => {
  const [uploadStatus, setUploadStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  const upload = useCallback(async (file, uploadFunction, onProgress) => {
    setUploadStatus('uploading')
    setProgress(0)
    setError(null)

    try {
      const result = await uploadFunction(file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        setProgress(percentCompleted)
        onProgress?.(percentCompleted)
      })

      setUploadStatus('success')
      setProgress(100)
      return result
    } catch (error) {
      setUploadStatus('error')
      setError(error)
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setUploadStatus('idle')
    setProgress(0)
    setError(null)
  }, [])

  return {
    upload,
    reset,
    uploadStatus,
    progress,
    error,
    isUploading: uploadStatus === 'uploading',
    isSuccess: uploadStatus === 'success',
    isError: uploadStatus === 'error'
  }
}

// 键盘快捷键Hook
export const useKeyboard = (keyMap) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase()
      const ctrl = event.ctrlKey
      const shift = event.shiftKey
      const alt = event.altKey

      for (const [shortcut, callback] of Object.entries(keyMap)) {
        const parts = shortcut.toLowerCase().split('+')
        const targetKey = parts[parts.length - 1]
        const modifiers = parts.slice(0, -1)

        const needsCtrl = modifiers.includes('ctrl')
        const needsShift = modifiers.includes('shift')
        const needsAlt = modifiers.includes('alt')

        // 检查键和修饰键是否匹配
        if (key === targetKey &&
            ctrl === needsCtrl &&
            shift === needsShift &&
            alt === needsAlt) {
          event.preventDefault()
          callback(event)
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [keyMap])
}

// 窗口大小Hook
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })

  useEffect(() => {
    const handleResize = debounce(() => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }, 100)

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return windowSize
}

// 点击外部Hook
export const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return
      }
      handler(event)
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}

// 前一个值Hook
export const usePrevious = (value) => {
  const ref = useRef()
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

// 组件挂载状态Hook
export const useIsMounted = () => {
  const isMountedRef = useRef(true)
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])
  
  return isMountedRef
}
