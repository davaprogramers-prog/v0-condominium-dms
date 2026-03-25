"use client"

import { useState } from "react"
import { createSurvey, voteSurvey, closeSurvey } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, Vote, X, Trash2 } from "lucide-react"

interface EncuestasClientProps {
  surveys: Record<string, unknown>[]
  userId: string
  totalHouses: number
  isAdmin: boolean
}

export function EncuestasClient({ surveys, userId, totalHouses, isAdmin }: EncuestasClientProps) {
  const [openNew, setOpenNew] = useState(false)
  const [options, setOptions] = useState<string[]>(["", ""])
  const [voting, setVoting] = useState<string | null>(null)

  const addOption = () => setOptions([...options, ""])
  const removeOption = (i: number) => setOptions(options.filter((_, idx) => idx !== i))
  const updateOption = (i: number, val: string) => {
    const copy = [...options]
    copy[i] = val
    setOptions(copy)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Encuestas</h1>
          <p className="text-sm text-muted-foreground">{surveys.length} encuestas en total</p>
        </div>
        {isAdmin && (
          <Dialog open={openNew} onOpenChange={(v) => { setOpenNew(v); if (!v) setOptions(["", ""]) }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Nueva Encuesta</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Crear Encuesta</DialogTitle></DialogHeader>
              <form
                action={async (fd) => {
                  const validOptions = options.filter((o) => o.trim())
                  fd.set("options", JSON.stringify(validOptions))
                  await createSurvey(fd)
                  setOpenNew(false)
                  setOptions(["", ""])
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="title">Titulo</Label>
                  <Input id="title" name="title" placeholder="Pregunta o tema de la encuesta" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Descripcion</Label>
                  <Textarea id="description" name="description" placeholder="Detalle adicional..." />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="closes_at">Cierre automatico (opcional)</Label>
                  <Input id="closes_at" name="closes_at" type="datetime-local" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Opciones de voto</Label>
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        placeholder={`Opcion ${i + 1}`}
                      />
                      {options.length > 2 && (
                        <button type="button" onClick={() => removeOption(i)} className="text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addOption}>
                    <Plus className="mr-1 h-3 w-3" />Agregar opcion
                  </Button>
                </div>
                <Button type="submit" disabled={options.filter((o) => o.trim()).length < 2}>
                  Crear Encuesta
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {surveys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <Vote className="h-10 w-10" />
            <p>No hay encuestas registradas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {surveys.map((survey) => {
            const surveyOptions = (survey.survey_options as Record<string, unknown>[]) || []
            const totalVotes = surveyOptions.reduce(
              (acc, opt) => acc + ((opt.survey_votes as Record<string, unknown>[])?.length || 0), 0
            )
            const userVoted = surveyOptions.some((opt) =>
              (opt.survey_votes as Record<string, unknown>[])?.some((v) => v.user_id === userId)
            )
            const isActive = survey.is_active as boolean

            return (
              <Card key={survey.id as string} className={!isActive ? "opacity-70" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{survey.title as string}</CardTitle>
                        <Badge variant={isActive ? "default" : "secondary"}>
                          {isActive ? "Activa" : "Cerrada"}
                        </Badge>
                      </div>
                      {survey.description && (
                        <CardDescription className="mt-1">{survey.description as string}</CardDescription>
                      )}
                    </div>
                    {isAdmin && isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => closeSurvey(survey.id as string)}
                      >
                        Cerrar Encuesta
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {surveyOptions
                    .sort((a, b) => (a.display_order as number || 0) - (b.display_order as number || 0))
                    .map((opt) => {
                      const optVotes = (opt.survey_votes as Record<string, unknown>[])?.length || 0
                      const percentage = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0
                      const isUserVote = (opt.survey_votes as Record<string, unknown>[])?.some(
                        (v) => v.user_id === userId
                      )

                      return (
                        <div key={opt.id as string} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isActive && !userVoted ? (
                                <button
                                  type="button"
                                  disabled={voting === (opt.id as string)}
                                  onClick={async () => {
                                    setVoting(opt.id as string)
                                    await voteSurvey(survey.id as string, opt.id as string)
                                    setVoting(null)
                                  }}
                                  className="rounded-md border px-3 py-1 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
                                >
                                  {opt.option_text as string}
                                </button>
                              ) : (
                                <span className={`text-sm ${isUserVote ? "font-semibold" : ""}`}>
                                  {opt.option_text as string}
                                  {isUserVote && " (tu voto)"}
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {optVotes} voto{optVotes !== 1 ? "s" : ""} ({percentage}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                  <p className="text-xs text-muted-foreground">
                    {totalVotes} voto{totalVotes !== 1 ? "s" : ""} en total
                    {totalHouses > 0 && ` de ${totalHouses} casas`}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
