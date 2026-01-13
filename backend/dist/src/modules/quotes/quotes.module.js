"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotesModule = void 0;
const common_1 = require("@nestjs/common");
const quotes_controller_1 = require("./quotes.controller");
const quotes_service_1 = require("./quotes.service");
const quote_archiving_service_1 = require("./quote-archiving.service");
const notifications_module_1 = require("../notifications/notifications.module");
const prisma_module_1 = require("../../common/prisma/prisma.module");
let QuotesModule = class QuotesModule {
};
exports.QuotesModule = QuotesModule;
exports.QuotesModule = QuotesModule = __decorate([
    (0, common_1.Module)({
        imports: [notifications_module_1.NotificationsModule, prisma_module_1.PrismaModule],
        controllers: [quotes_controller_1.QuotesController],
        providers: [quotes_service_1.QuotesService, quote_archiving_service_1.QuoteArchivingService],
        exports: [quotes_service_1.QuotesService, quote_archiving_service_1.QuoteArchivingService],
    })
], QuotesModule);
//# sourceMappingURL=quotes.module.js.map