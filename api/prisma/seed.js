"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
function parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        }
        else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        }
        else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}
function readCsv(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split(/\r?\n/);
    return lines
        .filter(line => line.trim().length > 0)
        .map(line => parseCsvLine(line));
}
async function main() {
    console.log('🌱 Starting seed...');
    const mastersDir = path.join(__dirname, '../../masters');
    // 1. Seed Users (Default Roles)
    console.log(' seeding default users...');
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('gnfc123', salt);
    const usersToSeed = [
        { username: 'admin', email: 'admin@gnfc.in', role: client_1.Role.ADMIN },
        { username: 'employee', email: 'employee@gnfc.in', role: client_1.Role.RECOMMENDING_EMPLOYEE },
        { username: 'sectionhead', email: 'head@gnfc.in', role: client_1.Role.TRAINING_CENTER_SECTION_HEAD },
        { username: 'incharge', email: 'incharge@gnfc.in', role: client_1.Role.TRAINING_IN_CHARGE },
        { username: 'approver', email: 'approver@gnfc.in', role: client_1.Role.ED_GM_APPROVER },
    ];
    for (const user of usersToSeed) {
        await prisma.user.upsert({
            where: { username: user.username },
            update: {},
            create: {
                username: user.username,
                email: user.email,
                password: defaultPasswordHash,
                role: user.role,
            },
        });
    }
    // Seed default employees for reference
    console.log(' seeding sample employees...');
    const sampleEmployees = [
        { employee_no: '8979', name: 'Tanay Desai', department: 'IT', email: 'tjdesai@gnfc.in', designation: 'Developer' },
        { employee_no: '1001', name: 'John Doe', department: 'Chemical', email: 'employee@gnfc.in', designation: 'Engineer' },
    ];
    for (const emp of sampleEmployees) {
        const dbEmp = await prisma.employee.upsert({
            where: { employee_no: emp.employee_no },
            update: {},
            create: emp,
        });
        // Link to user if username matches
        if (emp.employee_no === '8979') {
            await prisma.user.upsert({
                where: { username: 'admin' },
                update: { employeeId: dbEmp.id },
                create: { username: 'admin', email: 'admin@gnfc.in', password: defaultPasswordHash, role: client_1.Role.ADMIN, employeeId: dbEmp.id }
            });
        }
        else if (emp.employee_no === '1001') {
            await prisma.user.upsert({
                where: { username: 'employee' },
                update: { employeeId: dbEmp.id },
                create: { username: 'employee', email: 'employee@gnfc.in', password: defaultPasswordHash, role: client_1.Role.RECOMMENDING_EMPLOYEE, employeeId: dbEmp.id }
            });
        }
    }
    // 2. Financial Year
    console.log(' seeding financial year...');
    await prisma.financialYear.upsert({
        where: { year_string: '2026-27' },
        update: {},
        create: { year_string: '2026-27', active: true },
    });
    // 3. Category Master
    console.log(' seeding categories...');
    const categoryPath = path.join(mastersDir, 'category_master.csv');
    if (fs.existsSync(categoryPath)) {
        const [, ...rows] = readCsv(categoryPath); // skip header
        for (const row of rows) {
            if (row.length >= 2) {
                const id = parseInt(row[0], 10);
                const name = row[1];
                if (!isNaN(id) && name) {
                    await prisma.category.upsert({
                        where: { name },
                        update: {},
                        create: { id, name },
                    });
                }
            }
        }
    }
    // 4. Branch Master
    console.log(' seeding branches...');
    const branchPath = path.join(mastersDir, 'branch_master.csv');
    if (fs.existsSync(branchPath)) {
        const [, ...rows] = readCsv(branchPath);
        for (const row of rows) {
            if (row.length >= 2) {
                const id = parseInt(row[0], 10);
                const name = row[1];
                if (!isNaN(id) && name) {
                    await prisma.branch.upsert({
                        where: { branch_name: name },
                        update: {},
                        create: { id, branch_name: name },
                    });
                }
            }
        }
    }
    // 5. College Master
    console.log(' seeding colleges...');
    const collegePath = path.join(mastersDir, 'college_master.csv');
    if (fs.existsSync(collegePath)) {
        const [, ...rows] = readCsv(collegePath);
        for (const row of rows) {
            if (row.length >= 3) {
                const id = parseInt(row[0], 10);
                const name = row[1];
                const place = row[2];
                if (!isNaN(id) && name && place) {
                    await prisma.college.upsert({
                        where: { id },
                        update: { college_name: name, place },
                        create: { id, college_name: name, place },
                    });
                }
            }
        }
    }
    // 6. State Master
    console.log(' seeding states...');
    const statePath = path.join(mastersDir, 'state_master.csv');
    if (fs.existsSync(statePath)) {
        const [, ...rows] = readCsv(statePath);
        for (const row of rows) {
            if (row.length >= 2) {
                const id = parseInt(row[0], 10);
                const name = row[1];
                if (!isNaN(id) && name) {
                    await prisma.state.upsert({
                        where: { name },
                        update: {},
                        create: { id, name },
                    });
                }
            }
        }
    }
    // Ensure Gujarat state exists
    const gujaratState = await prisma.state.upsert({
        where: { name: 'GUJARAT' },
        update: {},
        create: { id: 7, name: 'GUJARAT' },
    });
    // 7. District Master (All mapped to Gujarat State = 7)
    console.log(' seeding districts...');
    const districtPath = path.join(mastersDir, 'district_master.csv');
    if (fs.existsSync(districtPath)) {
        const [, ...rows] = readCsv(districtPath);
        for (const row of rows) {
            if (row.length >= 2) {
                const id = parseInt(row[0], 10);
                const name = row[1];
                if (!isNaN(id) && name) {
                    await prisma.district.upsert({
                        where: { id },
                        update: { name, stateId: gujaratState.id },
                        create: { id, name, stateId: gujaratState.id },
                    });
                }
            }
        }
    }
    // 8. Taluka Master
    console.log(' seeding talukas...');
    const talukaPath = path.join(mastersDir, 'taluka_master.csv');
    if (fs.existsSync(talukaPath)) {
        const [, ...rows] = readCsv(talukaPath);
        const districts = await prisma.district.findMany();
        const districtMap = new Map(districts.map(d => [d.name.toUpperCase(), d.id]));
        let talukaId = 1;
        for (const row of rows) {
            if (row.length >= 2) {
                const districtName = row[0].toUpperCase();
                const talukaName = row[1];
                const districtId = districtMap.get(districtName);
                if (districtId && talukaName) {
                    await prisma.taluka.upsert({
                        where: { id: talukaId },
                        update: { name: talukaName, districtId },
                        create: { id: talukaId, name: talukaName, districtId },
                    });
                    talukaId++;
                }
            }
        }
    }
    // 9. City Master
    console.log(' seeding cities...');
    const cityPath = path.join(mastersDir, 'city_master.csv');
    if (fs.existsSync(cityPath)) {
        const [, ...rows] = readCsv(cityPath);
        for (const row of rows) {
            if (row.length >= 2) {
                const id = parseInt(row[0], 10);
                const place = row[1];
                if (!isNaN(id) && place) {
                    await prisma.city.upsert({
                        where: { id },
                        update: { name: place },
                        create: { id, name: place },
                    });
                }
            }
        }
    }
    // 10. Default Department Master
    console.log(' seeding default departments...');
    const defaultDepts = ['IT', 'CHEMICAL', 'MECHANICAL', 'ELECTRICAL', 'HR', 'FINANCE', 'SAFETY', 'INSTRUMENTATION'];
    for (const dept of defaultDepts) {
        await prisma.department.upsert({
            where: { department_name: dept },
            update: {},
            create: { department_name: dept },
        });
    }
    console.log('🌱 Seed completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
