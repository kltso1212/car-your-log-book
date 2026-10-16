using dotnet.Models;

namespace dotnet.Services
{
    public interface IInsuranceRecordService
    {
        Task<IEnumerable<InsuranceRecordDto>> GetAllAsync(int vehicleId);
        Task<long> AddAsync(int vehicleId, InsuranceRecordDto req);
        Task<bool> DeleteByIdAsync(int vehicleId, long id);
        Task<UpdateOutcome> UpdateAsync(int vehicleId, long id, InsuranceRecordDto req);
    }

    public class InsuranceRecordService : IInsuranceRecordService
    {
        private readonly AppDbContext _context;
        public InsuranceRecordService(AppDbContext context)
        {
            _context = context;
        }
        public IEnumerable<Vehicle> Vehicles => _context.Vehicles;
        public IEnumerable<InsuranceRecord> InsuranceRecords => _context.InsuranceRecords;
        public async Task<IEnumerable<InsuranceRecordDto>> GetAllAsync(int vehicleId)
        {
            return await Task.Run(() => InsuranceRecords
                .Where(f => f.VehicleId == vehicleId)
                .OrderByDescending(f => f.Date).ThenByDescending(f => f.Id)
                .Select(f => f.Data).ToList());
        }
        public async Task<long> AddAsync(int vehicleId, InsuranceRecordDto req)
        {
            var vehicle = await Task.Run(() => Vehicles.Where(v => v.Id == vehicleId).FirstOrDefault());
            if (vehicle is null) return 0;

            try
            {
                var record = new InsuranceRecord(req) { VehicleId = vehicleId };
                await _context.InsuranceRecords.AddAsync(record);
                await _context.SaveChangesAsync();
                return record.Id;
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException)
            {
                return -1; // UNIQUE(vehicle_id, date) clash
            }
        }
        public async Task<bool> DeleteByIdAsync(int vehicleId, long id)
        {
            var record = await Task.Run(() => InsuranceRecords
                .Where(f => f.Id == id && f.VehicleId == vehicleId).FirstOrDefault());
            if (record is null) return false;

            ImageStorage.DeleteFor(_context, "insurance_record", (int)record.Id);
            _context.InsuranceRecords.Remove(record);
            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<UpdateOutcome> UpdateAsync(int vehicleId, long id, InsuranceRecordDto req)
        {
            var record = await Task.Run(() => InsuranceRecords
                .Where(f => f.Id == id && f.VehicleId == vehicleId).FirstOrDefault());
            if (record is null) return UpdateOutcome.NotFound;

            record.Date = req.Date;
            record.Type = req.Type;
            record.Broker = req.Broker;
            record.Fee = req.Fee;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException)
            {
                return UpdateOutcome.Conflict;
            }
            return UpdateOutcome.Updated;
        }
    }

    public interface ILicenceRecordService
    {
        Task<IEnumerable<LicenceRecordDto>> GetAllAsync(int vehicleId);
        Task<long> AddAsync(int vehicleId, LicenceRecordDto req);
        Task<bool> DeleteByIdAsync(int vehicleId, long id);
        Task<UpdateOutcome> UpdateAsync(int vehicleId, long id, LicenceRecordDto req);
    }

    public class LicenceRecordService : ILicenceRecordService
    {
        private readonly AppDbContext _context;
        public LicenceRecordService(AppDbContext context)
        {
            _context = context;
        }
        public IEnumerable<Vehicle> Vehicles => _context.Vehicles;
        public IEnumerable<LicenceRecord> LicenceRecords => _context.LicenceRecords;
        public async Task<IEnumerable<LicenceRecordDto>> GetAllAsync(int vehicleId)
        {
            return await Task.Run(() => LicenceRecords
                .Where(f => f.VehicleId == vehicleId)
                .OrderByDescending(f => f.Date).ThenByDescending(f => f.Id)
                .Select(f => f.Data).ToList());
        }
        public async Task<long> AddAsync(int vehicleId, LicenceRecordDto req)
        {
            var vehicle = await Task.Run(() => Vehicles.Where(v => v.Id == vehicleId).FirstOrDefault());
            if (vehicle is null) return 0;

            try
            {
                var record = new LicenceRecord(req) { VehicleId = vehicleId };
                await _context.LicenceRecords.AddAsync(record);
                await _context.SaveChangesAsync();
                return record.Id;
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException)
            {
                return -1; // UNIQUE(vehicle_id, date) clash
            }
        }
        public async Task<bool> DeleteByIdAsync(int vehicleId, long id)
        {
            var record = await Task.Run(() => LicenceRecords
                .Where(f => f.Id == id && f.VehicleId == vehicleId).FirstOrDefault());
            if (record is null) return false;

            ImageStorage.DeleteFor(_context, "licence_record", (int)record.Id);
            _context.LicenceRecords.Remove(record);
            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<UpdateOutcome> UpdateAsync(int vehicleId, long id, LicenceRecordDto req)
        {
            var record = await Task.Run(() => LicenceRecords
                .Where(f => f.Id == id && f.VehicleId == vehicleId).FirstOrDefault());
            if (record is null) return UpdateOutcome.NotFound;

            record.Date = req.Date;
            record.Type = req.Type;
            record.Fee = req.Fee;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException)
            {
                return UpdateOutcome.Conflict;
            }
            return UpdateOutcome.Updated;
        }
    }
}
