import { toast as sonnerToast, type ExternalToast } from "sonner"

type ToastOptions = ExternalToast

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, options)
  },

  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, options)
  },

  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, options)
  },

  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, options)
  },

  loading: (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(message, options)
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: Error) => string)
    }
  ) => {
    return sonnerToast.promise(promise, messages)
  },

  dismiss: (id?: string | number) => {
    return sonnerToast.dismiss(id)
  },
}
