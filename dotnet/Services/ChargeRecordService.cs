using dotnet.Models;

namespace dotnet.Services
{
    public interface IChargeRecordService
    {
        Task<IEnumerable<ChargeRecordDto>> GetAllAsync(int vehicleId);
        Task<ChargeRecord?> GetByOdmAsync(int vehicleId, int odm);
        Task<long> AddAsync(int vehicleId, ChargeRecordDto req);
        Task<bool> DeleteByOdmAsync(int vehicleId, int odm);
        Task<UpdateOutcome> UpdateAsync(int vehicleId, long id, ChargeRecordDto req);
    }

    public class ChargeRecordService : IChargeRecordService
    {
        private readonly AppDbContext _context;
        public ChargeRecordService(AppDbContext context)
        {
            _context = context;
        }
        public IEnumerable<Vehicle> Vehicles => _context.Vehicles;
        public IEnumerable<ChargeRecord> ChargeRecords => _context.ChargeRecords;
        public async Task<IEnumerable<ChargeRecordDto>> GetAllAsync(int vehicleId)
        {
            return await Task.Run(() => ChargeRecords
                .Where(f => f.VehicleId == vehicleId)
                .OrderBy(f => f.Odm)
                .Select(f => f.Data).ToList());
        }
        public async Task<ChargeRecord?> GetByOdmAsync(int vehicleId, int odm)
        {
            return await Task.Run(() => ChargeRecords
                .Where(f => f.VehicleId == vehicleId && f.Odm == odm).FirstOrDefault());
        }
        public async Task<long> AddAsync(int vehicleId, ChargeRecordDto req)
        {
            var vehicle = await Task.Run(() => Vehicles.Where(v => v.Id == vehicleId).FirstOrDefault());
            if (vehicle is null) return 0;
            var clash = await GetByOdmAsync(vehicleId, req.Odm);
            if (clash is not null) return -1; // UNIQUE(vehicle_id, odm) clash

            var record = new ChargeRecord(req) { VehicleId = vehicleId };
            await _context.ChargeRecords.AddAsync(record);
            await _context.SaveChangesAsync();
            return record.Id;
        }
        public async Task<bool> DeleteByOdmAsync(int vehicleId, int odm)
        {
            var record = await Task.Run(() => ChargeRecords
                .Where(f => f.VehicleId == vehicleId && f.Odm == odm).FirstOrDefault());
            if (record is null) return false;

            ImageStorage.DeleteFor(_context, "charge_record", (int)record.Id);
            _context.ChargeRecords.Remove(record);
            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<UpdateOutcome> UpdateAsync(int vehicleId, long id, ChargeRecordDto req)
        {
            var record = await Task.Run(() => ChargeRecords
                .Where(f => f.Id == id && f.VehicleId == vehicleId).FirstOrDefault());
            if (record is null) return UpdateOutcome.NotFound;

            var clash = await Task.Run(() => ChargeRecords
                .Where(f => f.VehicleId == vehicleId && f.Odm == req.Odm && f.Id != id)
                .FirstOrDefault());
            if (clash is not null) return UpdateOutcome.Conflict;

            record.Date = req.Date;
            record.Odm = req.Odm;
            record.Kwh = req.Kwh;
            record.Price = req.Price;
            await _context.SaveChangesAsync();
            return UpdateOutcome.Updated;
        }
    }
}
