"use client"

import { useState } from "react"
import { useTheme } from "../theme-context"
import { createSurvey, voteSurvey, closeSurvey, updateSurvey, deleteSurvey } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, Vote, X, MoreHorizontal, Edit2, Trash2, CheckCheck, CheckSquare } from "lucide-react"

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
  const [editOpen, setEditOpen] = useState<string | null>(null)
  const { dialogBgColor, dialogTextColor, inputBgColor, inputTextColor, cardBgColor, cardTextColor } = useTheme()

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
          <h1 className="text-2xl font-bold" style={{ color: cardTextColor }}>Encuestas</h1>
          <p className="text-sm text-muted-foreground" style={{ color: cardTextColor }}>{surveys.length} encuestas en total</p>
        </div>
        {isAdmin && (
          <Dialog open={openNew} onOpenChange={(v) => { setOpenNew(v); if (!v) setOptions(["", ""]) }}>
            <DialogTrigger asChild>
              <Button
                style={{
                  backgroundColor: "#2563eb",
                  color: "white",
                  padding: "12px 24px",
                  fontSize: "16px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  border: "2px solid #1d4ed8",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                <CheckSquare className="h-5 w-5" />
                Agregar Encuesta
              </Button>
            </DialogTrigger>
            <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }} className="max-w-lg">
              <DialogHeader>
                <DialogTitle style={{ color: dialogTextColor }}>Crear Encuesta</DialogTitle>
                <DialogDescription style={{ color: dialogTextColor }}>Crea una nueva encuesta para los residentes</DialogDescription>
              </DialogHeader>
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
                  <Label htmlFor="title" style={{ color: dialogTextColor }}>Titulo</Label>
                  <Input id="title" name="title" placeholder="Pregunta o tema de la encuesta" required style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description" style={{ color: dialogTextColor }}>Descripcion</Label>
                  <Textarea id="description" name="description" placeholder="Detalle adicional..." style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="closes_at" style={{ color: dialogTextColor }}>Cierre automatico (opcional)</Label>
                  <Input id="closes_at" name="closes_at" type="datetime-local" style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label style={{ color: dialogTextColor }}>Opciones de voto</Label>
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        placeholder={`Opcion ${i + 1}`}
                        style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
                      />
                      {options.length > 2 && (
                        <button type="button" onClick={() => removeOption(i)} style={{ color: inputTextColor }} className="hover:text-destructive">
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
        <Card style={{ backgroundColor: cardBgColor || undefined }}>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <Vote className="h-10 w-10" />
            <p style={{ color: cardTextColor }}>No hay encuestas registradas</p>
          </CardContent>
        </Card>
      ) : (
        surveys.map((survey) => {
          const isActive = !(survey.closed_at as string)
          const surveyOptions = (survey.survey_options as Record<string, unknown>[]) || []
          const totalVotes = surveyOptions.reduce((sum, opt) => sum + ((opt.survey_votes as Record<string, unknown>[])?.length || 0), 0)
          const userVoted = surveyOptions.some((opt) => (opt.survey_votes as Record<string, unknown>[])?.some((v) => v.voter_id === userId))

          return (
            <Card key={survey.id as string} style={{ backgroundColor: cardBgColor || undefined }} className="overflow-hidden">
              <div style={{
                height: "4px",
                backgroundColor: isActive ? "#22c55e" : "#ef4444",
                width: "100%"
              }}></div>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle style={{ color: cardTextColor }}>{survey.title as string}</CardTitle>
                      <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? "Activa" : "Cerrada"}
                      </Badge>
                    </div>
                    {survey.description ? (
                      <CardDescription style={{ color: cardTextColor }} className="mt-1">{survey.description as string}</CardDescription>
                    ) : null}
                  </div>
                  {isAdmin ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md border" style={{ backgroundColor: cardBgColor, borderColor: cardTextColor }}>
                      {isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => closeSurvey(survey.id as string)}
                        >
                          Cerrar
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" style={{ backgroundColor: cardBgColor, color: cardTextColor, borderColor: cardTextColor }}>
                          <DropdownMenuItem onClick={() => setEditOpen(survey.id as string)}>
                            <Edit2 className="h-4 w-4 mr-2" />Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <AlertDialog>
                              <AlertDialogTrigger className="flex items-center w-full px-2 py-1.5 text-sm text-destructive cursor-pointer hover:bg-accent rounded">
                                <Trash2 className="h-4 w-4 mr-2" />Eliminar
                              </AlertDialogTrigger>
                              <AlertDialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }}>
                                <AlertDialogHeader>
                                  <AlertDialogTitle style={{ color: dialogTextColor }}>Eliminar Encuesta: {survey.title as string}</AlertDialogTitle>
                                  <AlertDialogDescription style={{ color: dialogTextColor }}>
                                    Esta accion eliminara la encuesta y todos sus votos. No se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="flex gap-3 justify-end">
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction asChild>
                                    <Button variant="destructive" onClick={() => deleteSurvey(survey.id as string)}>
                                      Eliminar
                                    </Button>
                                  </AlertDialogAction>
                                </div>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Dialog open={editOpen === survey.id} onOpenChange={(v) => !v && setEditOpen(null)}>
                        <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }}>
                          <DialogHeader>
                            <DialogTitle style={{ color: dialogTextColor }}>Editar Encuesta</DialogTitle>
                            <DialogDescription style={{ color: dialogTextColor }}>Modifica los detalles de la encuesta</DialogDescription>
                          </DialogHeader>
                          <form
                            action={async (fd) => {
                              fd.set("id", survey.id as string)
                              await updateSurvey(fd)
                              setEditOpen(null)
                            }}
                            className="flex flex-col gap-4"
                          >
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="edit_title" style={{ color: dialogTextColor }}>Titulo</Label>
                              <Input id="edit_title" name="title" defaultValue={survey.title as string} required style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                            </div>
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="edit_desc" style={{ color: dialogTextColor }}>Descripcion</Label>
                              <Textarea id="edit_desc" name="description" defaultValue={(survey.description as string) || ""} style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                            </div>
                            <Button type="submit" className="w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Guardar Cambios</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent style={{ color: cardTextColor }} className="flex flex-col gap-3">
                {surveyOptions
                  .sort((a, b) => (a.display_order as number || 0) - (b.display_order as number || 0))
                  .map((opt) => {
                    const optVotes = (opt.survey_votes as Record<string, unknown>[])?.length || 0
                    const percentage = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0
                    const isUserVote = (opt.survey_votes as Record<string, unknown>[])?.some(
                      (v) => v.voter_id === userId
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
  )
}
