"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Landmark, ExternalLink } from "lucide-react"
import { useTheme } from "@/app/dashboard/theme-context"

interface CartolasClientProps {
  statements: Record<string, unknown>[]
  isAdmin: boolean
}

export function CartolasClient({ statements, isAdmin }: CartolasClientProps) {
  const { cardBgColor, cardTextColor, inputBgColor, inputTextColor } = useTheme()

  return (
    <Card style={{ backgroundColor: cardBgColor, borderColor: inputTextColor, borderWidth: "1px", color: cardTextColor }}>
      <CardHeader>
        <CardTitle className="text-base" style={{ color: cardTextColor }}>Historial de Cartolas</CardTitle>
        <CardDescription style={{ color: cardTextColor, opacity: 0.7 }}>Archivos PDF de cartolas bancarias del condominio</CardDescription>
      </CardHeader>
      <CardContent>
        {statements.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8" style={{ color: cardTextColor, opacity: 0.6 }}>
            <Landmark className="h-10 w-10" />
            <p>No hay cartolas subidas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: inputTextColor }}>
                  <TableHead style={{ color: cardTextColor }}>Título</TableHead>
                  <TableHead style={{ color: cardTextColor }}>Fecha</TableHead>
                  <TableHead style={{ color: cardTextColor }}>Notas</TableHead>
                  <TableHead style={{ color: cardTextColor }}>Subido</TableHead>
                  <TableHead style={{ color: cardTextColor }}>Archivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statements.map((stmt) => (
                  <TableRow key={stmt.id as string} style={{ borderColor: inputTextColor }}>
                    <TableCell className="font-medium" style={{ color: cardTextColor }}>{stmt.title as string}</TableCell>
                    <TableCell className="text-sm" style={{ color: cardTextColor }}>{stmt.statement_date as string}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm" style={{ color: cardTextColor, opacity: 0.7 }}>
                      {(stmt.notes as string) || "-"}
                    </TableCell>
                    <TableCell className="text-sm" style={{ color: cardTextColor }}>{new Date(stmt.created_at as string).toLocaleDateString("es-CL")}</TableCell>
                    <TableCell>
                      <a
                        href={stmt.file_url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm hover:underline"
                        style={{ color: "#2563eb" }}
                      >
                        <ExternalLink className="h-3 w-3" />Ver PDF
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
