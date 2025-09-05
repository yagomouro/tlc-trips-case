"use client"
import { Card } from "@/components/ui/card"
import type React from "react"

import { Button } from "@/components/ui/button"
import { TrendingUp, BarChart3, FileSearch, Lightbulb, Target, Zap, ArrowRight } from "lucide-react"

interface OnboardingCard {
  id: string
  title: string
  description: string
  prompt: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  category: "analysis" | "data" | "insights"
}

const onboardingPrompts: OnboardingCard[] = [
  {
    id: "compare-analysis",
    title: "Análise de valores",
    description: "Analise a média de valores e realize filtros",
    prompt:
      "Qual a média de valor total recebido em um mês considerando todos os yellow táxis da frota?",
    icon: BarChart3,
    color: "from-blue-500 to-blue-600",
    category: "analysis",
  },
  {
    id: "top-performers",
    title: "Top Performers",
    description: "Descubra os melhores resultados",
    prompt: "Qual a média de passageiros por cada hora do dia que pegaram táxi no mês de maio considerando todos os táxis da frota?",
    icon: TrendingUp,
    color: "from-green-500 to-green-600",
    category: "data",
  },
  {
    id: "quick-summary",
    title: "Resumo Executivo",
    description: "Informações condensadas e práticas",
    prompt: "Com base nos documentos fornecidos da empresa, quais são os pontos mais importantes sobre a cultura?",
    icon: FileSearch,
    color: "from-purple-500 to-purple-600",
    category: "insights",
  },
]

interface OnboardingCardsProps {
  onSelectPrompt: (prompt: string) => void
}

export function OnboardingCards({ onSelectPrompt }: OnboardingCardsProps) {
  const handleCardClick = (prompt: string) => {
    onSelectPrompt(prompt)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Experimente estas sugestões</h3>
        <p className="text-sm text-muted-foreground">Clique em qualquer cartão para começar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {onboardingPrompts.map((card, index) => {
          const Icon = card.icon
          return (
            <Card
              key={card.id}
              className="group cursor-pointer border-2 border-border hover:border-red-200 dark:hover:border-red-800 transition-all duration-300 hover-lift animate-scale-in overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => handleCardClick(card.prompt)}
            >
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-red-500 group-hover:translate-x-1 transition-all duration-300" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-foreground group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300">
                    {card.title}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">{card.description}</p>
                </div>

                <div className="pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300 group-hover:bg-red-50 dark:group-hover:bg-red-950/20"
                  >
                    <span className="truncate">"{card.prompt.substring(0, 40)}..."</span>
                  </Button>
                </div>
              </div>

              <div className="w-0 max-h-full h-0 max-h-full truncate absolute inset-0 bg-gradient-to-r from-red-500/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Card>
          )
        })}
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">💡 Ou digite sua própria pergunta no campo abaixo</p>
      </div>
    </div>
  )
}
