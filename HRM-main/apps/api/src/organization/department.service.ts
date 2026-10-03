import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) {}
  findAll() { return this.prisma.department.findMany({ orderBy: { name: "asc" } }); }
}