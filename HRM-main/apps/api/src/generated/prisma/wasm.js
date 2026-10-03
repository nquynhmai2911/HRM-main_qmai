
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  passwordHash: 'passwordHash',
  role: 'role',
  isActive: 'isActive',
  mustChangePassword: 'mustChangePassword',
  failedLoginCount: 'failedLoginCount',
  lockedUntil: 'lockedUntil',
  lastLoginAt: 'lastLoginAt',
  refreshToken: 'refreshToken',
  employeeId: 'employeeId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdBy: 'createdBy'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  action: 'action',
  resource: 'resource',
  resourceId: 'resourceId',
  oldValue: 'oldValue',
  newValue: 'newValue',
  ip: 'ip',
  createdAt: 'createdAt'
};

exports.Prisma.PermissionScalarFieldEnum = {
  id: 'id',
  resource: 'resource',
  action: 'action',
  scope: 'scope'
};

exports.Prisma.RolePermissionScalarFieldEnum = {
  id: 'id',
  role: 'role',
  permissionId: 'permissionId'
};

exports.Prisma.BranchScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  address: 'address',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DepartmentScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  parentId: 'parentId',
  branchId: 'branchId',
  managerId: 'managerId',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PositionScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  levelGroup: 'levelGroup',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmployeeScalarFieldEnum = {
  id: 'id',
  employeeCode: 'employeeCode',
  fullName: 'fullName',
  dob: 'dob',
  gender: 'gender',
  idNumber: 'idNumber',
  phone: 'phone',
  personalEmail: 'personalEmail',
  workEmail: 'workEmail',
  address: 'address',
  departmentId: 'departmentId',
  positionId: 'positionId',
  branchId: 'branchId',
  managerId: 'managerId',
  level: 'level',
  educationLevel: 'educationLevel',
  workMode: 'workMode',
  joinDate: 'joinDate',
  status: 'status',
  bankName: 'bankName',
  bankAccount: 'bankAccount',
  taxCode: 'taxCode',
  socialInsuranceNo: 'socialInsuranceNo',
  emergencyContact: 'emergencyContact',
  avatarUrl: 'avatarUrl',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdBy: 'createdBy'
};

exports.Prisma.EmployeeDocumentScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  type: 'type',
  fileUrl: 'fileUrl',
  fileName: 'fileName',
  issueDate: 'issueDate',
  verified: 'verified',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DependentScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  fullName: 'fullName',
  relation: 'relation',
  dob: 'dob',
  idNumber: 'idNumber',
  registeredFrom: 'registeredFrom',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmployeeHistoryScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  field: 'field',
  oldValue: 'oldValue',
  newValue: 'newValue',
  effectiveDate: 'effectiveDate',
  changedBy: 'changedBy',
  createdAt: 'createdAt'
};

exports.Prisma.JobRequisitionScalarFieldEnum = {
  id: 'id',
  code: 'code',
  title: 'title',
  departmentId: 'departmentId',
  positionId: 'positionId',
  level: 'level',
  quantity: 'quantity',
  filledCount: 'filledCount',
  reason: 'reason',
  salaryMin: 'salaryMin',
  salaryMax: 'salaryMax',
  requiredSkills: 'requiredSkills',
  minExperienceYears: 'minExperienceYears',
  description: 'description',
  status: 'status',
  requestedById: 'requestedById',
  rejectReason: 'rejectReason',
  targetDate: 'targetDate',
  approvedAt: 'approvedAt',
  closedAt: 'closedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CandidateScalarFieldEnum = {
  id: 'id',
  fullName: 'fullName',
  email: 'email',
  phone: 'phone',
  cvUrl: 'cvUrl',
  skills: 'skills',
  yearsExperience: 'yearsExperience',
  source: 'source',
  referrerEmployeeId: 'referrerEmployeeId',
  note: 'note',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ApplicationScalarFieldEnum = {
  id: 'id',
  candidateId: 'candidateId',
  requisitionId: 'requisitionId',
  stage: 'stage',
  result: 'result',
  rejectReasonId: 'rejectReasonId',
  appliedAt: 'appliedAt',
  updatedAt: 'updatedAt',
  testScore: 'testScore',
  testLink: 'testLink',
  referenceCheck: 'referenceCheck',
  referenceCheckRequired: 'referenceCheckRequired'
};

exports.Prisma.RejectReasonScalarFieldEnum = {
  id: 'id',
  name: 'name',
  isActive: 'isActive'
};

exports.Prisma.InterviewScalarFieldEnum = {
  id: 'id',
  applicationId: 'applicationId',
  round: 'round',
  scheduledAt: 'scheduledAt',
  meetingLink: 'meetingLink',
  interviewerId: 'interviewerId',
  status: 'status',
  totalScore: 'totalScore',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ScorecardScalarFieldEnum = {
  id: 'id',
  interviewId: 'interviewId',
  interviewerId: 'interviewerId',
  technicalScore: 'technicalScore',
  communicationScore: 'communicationScore',
  cultureScore: 'cultureScore',
  englishScore: 'englishScore',
  recommendation: 'recommendation',
  comment: 'comment',
  createdAt: 'createdAt'
};

exports.Prisma.OfferScalarFieldEnum = {
  id: 'id',
  applicationId: 'applicationId',
  salary: 'salary',
  startDate: 'startDate',
  status: 'status',
  sentAt: 'sentAt',
  respondedAt: 'respondedAt',
  note: 'note',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RecruitmentCostScalarFieldEnum = {
  id: 'id',
  requisitionId: 'requisitionId',
  description: 'description',
  amount: 'amount',
  createdAt: 'createdAt'
};

exports.Prisma.ContractScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  type: 'type',
  startDate: 'startDate',
  endDate: 'endDate',
  baseSalary: 'baseSalary',
  probationSalaryPercent: 'probationSalaryPercent',
  fileUrl: 'fileUrl',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdBy: 'createdBy'
};

exports.Prisma.ProbationReviewScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  contractId: 'contractId',
  technicalScore: 'technicalScore',
  attitudeScore: 'attitudeScore',
  result: 'result',
  comment: 'comment',
  reviewerId: 'reviewerId',
  approvedById: 'approvedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AttendanceLogScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  date: 'date',
  checkInAt: 'checkInAt',
  checkOutAt: 'checkOutAt',
  workMode: 'workMode',
  ip: 'ip',
  lat: 'lat',
  lng: 'lng',
  workedHours: 'workedHours',
  lateMinutes: 'lateMinutes',
  earlyLeaveMinutes: 'earlyLeaveMinutes',
  isManualEntry: 'isManualEntry',
  note: 'note',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeaveTypeScalarFieldEnum = {
  id: 'id',
  name: 'name',
  isPaid: 'isPaid',
  defaultDaysPerYear: 'defaultDaysPerYear',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeaveBalanceScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  leaveTypeId: 'leaveTypeId',
  year: 'year',
  total: 'total',
  used: 'used',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeaveRequestScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  leaveTypeId: 'leaveTypeId',
  fromDate: 'fromDate',
  toDate: 'toDate',
  days: 'days',
  reason: 'reason',
  status: 'status',
  approverId: 'approverId',
  approvedAt: 'approvedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OvertimeRequestScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  date: 'date',
  startTime: 'startTime',
  endTime: 'endTime',
  hours: 'hours',
  dayType: 'dayType',
  projectId: 'projectId',
  reason: 'reason',
  status: 'status',
  approverId: 'approverId',
  approvedAt: 'approvedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProjectScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  managerId: 'managerId',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HolidayScalarFieldEnum = {
  id: 'id',
  date: 'date',
  name: 'name',
  year: 'year'
};

exports.Prisma.AttendanceClosingScalarFieldEnum = {
  id: 'id',
  month: 'month',
  year: 'year',
  closedBy: 'closedBy',
  closedAt: 'closedAt'
};

exports.Prisma.SalaryProfileScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  baseSalary: 'baseSalary',
  allowances: 'allowances',
  effectiveFrom: 'effectiveFrom',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollPeriodScalarFieldEnum = {
  id: 'id',
  month: 'month',
  year: 'year',
  status: 'status',
  version: 'version',
  note: 'note',
  createdBy: 'createdBy',
  approvedBy: 'approvedBy',
  approvedAt: 'approvedAt',
  paidAt: 'paidAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayslipScalarFieldEnum = {
  id: 'id',
  periodId: 'periodId',
  employeeId: 'employeeId',
  workDays: 'workDays',
  standardWorkDays: 'standardWorkDays',
  baseIncome: 'baseIncome',
  allowanceTotal: 'allowanceTotal',
  otAmount: 'otAmount',
  bonus: 'bonus',
  grossIncome: 'grossIncome',
  insuranceEmployee: 'insuranceEmployee',
  insuranceCompany: 'insuranceCompany',
  personalIncomeTax: 'personalIncomeTax',
  otherDeduction: 'otherDeduction',
  netPay: 'netPay',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayslipItemScalarFieldEnum = {
  id: 'id',
  payslipId: 'payslipId',
  type: 'type',
  name: 'name',
  amount: 'amount',
  createdAt: 'createdAt'
};

exports.Prisma.SystemConfigScalarFieldEnum = {
  id: 'id',
  key: 'key',
  value: 'value',
  description: 'description',
  effectiveFrom: 'effectiveFrom',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  User: 'User',
  AuditLog: 'AuditLog',
  Permission: 'Permission',
  RolePermission: 'RolePermission',
  Branch: 'Branch',
  Department: 'Department',
  Position: 'Position',
  Employee: 'Employee',
  EmployeeDocument: 'EmployeeDocument',
  Dependent: 'Dependent',
  EmployeeHistory: 'EmployeeHistory',
  JobRequisition: 'JobRequisition',
  Candidate: 'Candidate',
  Application: 'Application',
  RejectReason: 'RejectReason',
  Interview: 'Interview',
  Scorecard: 'Scorecard',
  Offer: 'Offer',
  RecruitmentCost: 'RecruitmentCost',
  Contract: 'Contract',
  ProbationReview: 'ProbationReview',
  AttendanceLog: 'AttendanceLog',
  LeaveType: 'LeaveType',
  LeaveBalance: 'LeaveBalance',
  LeaveRequest: 'LeaveRequest',
  OvertimeRequest: 'OvertimeRequest',
  Project: 'Project',
  Holiday: 'Holiday',
  AttendanceClosing: 'AttendanceClosing',
  SalaryProfile: 'SalaryProfile',
  PayrollPeriod: 'PayrollPeriod',
  Payslip: 'Payslip',
  PayslipItem: 'PayslipItem',
  SystemConfig: 'SystemConfig'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
