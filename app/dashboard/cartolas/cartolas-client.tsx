"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Landmark, ExternalLink } from "lucide-react"

interface CartolasClientProps {
  statements: Record<string, unknown>[]
  isAdmin: boolean
}

export function CartolasClient({ statements, isAdmin }: CartolasClientProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        {statements.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <Landmark className="h-10 w-10" />
            <p>No hay cartolas subidas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead>Subido</TableHead>
                  <TableHead>Archivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statements.map((stmt) => (
                  <TableRow key={stmt.id as string}>
                    <TableCell className="font-medium">{stmt.title as string}</TableCell>
                    <TableCell className="text-sm">{stmt.statement_date as string}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {(stmt.notes as string) || "-"}
                    </TableCell>
                    <TableCell className="text-sm">{new Date(stmt.created_at as string).toLocaleDateString("es-CL")}</TableCell>
                    <TableCell>
                      <a
                        href={stmt.file_url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ver PDF
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
