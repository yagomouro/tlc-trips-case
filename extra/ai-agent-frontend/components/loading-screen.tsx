"use client"
import { useEffect, useState } from "react"
import { Bot, Database, FileText, MessageCircle } from "lucide-react"

interface LoadingScreenProps {
  onComplete: () => void
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [currentFeature, setCurrentFeature] = useState(0)

  const features = [
    {
      icon: Database,
      title: "Consultas ao Banco",
      description: "Pesquise dados do banco de dados com linguagem natural",
    },
    {
      icon: FileText,
      title: "Documentos da Empresa",
      description: "Acesse informações e dados da empresa rapidamente",
    },
    {
      icon: MessageCircle,
      title: "Respostas Inteligentes",
      description: "Faça perguntas normais e receba respostas precisas",
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 500)
          return 100
        }
        return prev + 2
      })
    }, 150)

    const featureInterval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 2000)

    return () => {
      clearInterval(interval)
      clearInterval(featureInterval)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-red-950/20 dark:via-background dark:to-red-950/20 flex items-center justify-center z-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-400/5 rounded-full blur-3xl animate-spin-slow" />
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        {/* Logo and title */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl mb-6 shadow-2xl animate-bounce-gentle">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 dark:from-red-400 dark:to-red-500 bg-clip-text text-transparent mb-2">
            Olá, sou o AiFood!
          </h1>
          <p className="text-muted-foreground text-lg">Seu assistente inteligente está carregando...</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="w-full bg-red-100 dark:bg-red-950/30 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-300 ease-out shadow-lg"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
        </div>

        {/* Feature showcase */}
        <div className="space-y-4">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const isActive = index === currentFeature

            return (
              <div
                key={index}
                className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-500 ${
                  isActive
                    ? "bg-red-50 dark:bg-red-950/20 scale-105 shadow-lg border border-red-200 dark:border-red-800"
                    : "bg-white/50 dark:bg-white/5 scale-95 opacity-60"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-500 ${
                    isActive
                      ? "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg"
                      : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Loading dots */}
        <div className="flex justify-center space-x-2 mt-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-red-500 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
