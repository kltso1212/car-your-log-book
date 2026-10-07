using dotnet.Models;

namespace dotnet.Services
{
    public interface IServiceRecordService
    {
        Task<IEnumerable<ServiceRecordDto>> GetAllAsync(int vehicleId);
        Task<ServiceRecord?> GetByOdmAsync(int vehicleId, int odm);
        Task<bool> AddAsync(int vehicleId, ServiceRecordDto req);
        Task<bool> DeleteByOdmAsync(int vehicleId, int odm);
        Task<UpdateOutcome> UpdateAsync(int vehicleId, long id, ServiceRecordDto req);
    }

    public class ServiceRecordService : IServiceRecordService
    {
        private readonly AppDbContext _context;
        public ServiceRecordService(AppDbContext context)
        {
            _context = context;
        }
        public IEnumerable<Vehicle> Vehicles => _context.Vehicles;
        public IEnumerable<ServiceRecord> ServiceRecords => _context.ServiceRecords;
        public async Task<IEnumerable<ServiceRecordDto>> GetAllAsync(int vehicleId)
        {
            return await Task.Run(() => ServiceRecords
                .Where(f => f.VehicleId == vehicleId)
                .OrderBy(f => f.Odm)
                .Select(f => f.Data).ToList());
        }
        public async Task<ServiceRecord?> GetByOdmAsync(int vehicleId, int odm)
        {
            return await Task.Run(() => ServiceRecords
                .Where(f => f.VehicleId == vehicleId && f.Odm == odm).FirstOrDefault());
        }
        public async Task<bool> AddAsync(int vehicleId, ServiceRecordDto req)
        {
            var vehicle = await Task.Run(() => Vehicles.Where(v => v.Id == vehicleId).FirstOrDefault());
            if (vehicle is null) return false;
            var clash = await GetByOdmAsync(vehicleId, req.Odm);
            if (clash is not null) return false;

            await _context.ServiceRecords.AddAsync(new(req) { VehicleId = vehicleId });
            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<bool> DeleteByOdmAsync(int vehicleId, int odm)
        {
            var record = await Task.Run(() => ServiceRecords
                .Where(f => f.VehicleId == vehicleId && f.Odm == odm).FirstOrDefault());
            if (record is null) return false;

            _context.ServiceRecords.Remove(record);
            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<UpdateOutcome> UpdateAsync(int vehicleId, long id, ServiceRecordDto req)
        {
            var record = await Task.Run(() => ServiceRecords
                .Where(f => f.Id == id && f.VehicleId == vehicleId).FirstOrDefault());
            if (record is null) return UpdateOutcome.NotFound;

            var clash = await Task.Run(() => ServiceRecords
                .Where(f => f.VehicleId == vehicleId && f.Odm == req.Odm && f.Id != id)
                .FirstOrDefault());
            if (clash is not null) return UpdateOutcome.Conflict;

            record.Date = req.Date;
            record.Odm = req.Odm;
            record.Items = System.Text.Json.JsonSerializer.Serialize(req.Items ?? []);
            record.CustomItem = req.CustomItem;
            record.Price = req.Price;
            await _context.SaveChangesAsync();
            return UpdateOutcome.Updated;
        }
    }
}
