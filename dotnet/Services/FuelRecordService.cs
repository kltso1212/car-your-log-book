using System.Data.Entity;
using dotnet.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace dotnet.Services
{
    public interface IFuelRecordService
    {
        Task<IEnumerable<FuelRecordDto>> GetAllAsync(int vehicleId);
        Task<FuelRecord?> GetByOdmAsync(int vehicleId, int odm);
        Task<bool> AddAsync(int vehicleId, FuelRecordDto req);
        Task<bool> DeleteByOdmAsync(int vehicleId, int odm);
        Task<UpdateOutcome> UpdateAsync(int vehicleId, long id, FuelRecordDto req);
    }

    public enum UpdateOutcome { Updated, NotFound, Conflict }

    public class FuelRecordService : IFuelRecordService
    {
        private readonly AppDbContext _context;
        public FuelRecordService(AppDbContext context)
        {
            _context = context;
        }
        public IEnumerable<Vehicle> Vehicles => _context.Vehicles;
        public IEnumerable<FuelRecord> FuelRecords => _context.FuelRecords;
        public async Task<IEnumerable<FuelRecordDto>> GetAllAsync(int vehicleId)
        {
            return await Task.Run(() => FuelRecords.Where(f => f.VehicleId == vehicleId).Select(f => f.Data).ToList());
        }
        public async Task<FuelRecord?> GetByOdmAsync(int vehicleId, int odm)
        {
            return await Task.Run(() => FuelRecords.Where(f => f.VehicleId == vehicleId && f.Odm == odm).FirstOrDefault());
        }
        public async Task<bool> AddAsync(int vehicleId, FuelRecordDto req)
        {
            var vehicle = await Task.Run(() => GetVehicle(vehicleId));
            if (vehicle is null) return false;
            var fuelRecord = await GetByOdmAsync(vehicleId, req.Odm);
            if (fuelRecord is not null) return false;

            await _context.FuelRecords.AddAsync(new(req) { VehicleId = vehicleId });
            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<bool> DeleteByOdmAsync(int vehicleId, int odm)
        {
            var fuelRecord = await Task.Run(() => GetByOdm(vehicleId, odm));
            if (fuelRecord is null) return false;

            _context.FuelRecords.Remove(fuelRecord);
            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<UpdateOutcome> UpdateAsync(int vehicleId, long id, FuelRecordDto req)
        {
            var fuelRecord = await Task.Run(() =>
                FuelRecords.Where(f => f.Id == id && f.VehicleId == vehicleId).FirstOrDefault());
            if (fuelRecord is null) return UpdateOutcome.NotFound;

            var clash = await Task.Run(() => FuelRecords
                .Where(f => f.VehicleId == vehicleId && f.Odm == req.Odm && f.Id != id)
                .FirstOrDefault());
            if (clash is not null) return UpdateOutcome.Conflict;

            fuelRecord.Date = req.Date;
            fuelRecord.Odm = req.Odm;
            fuelRecord.Vendor = req.Vendor;
            fuelRecord.FuelType = req.FuelType;
            fuelRecord.Litre = req.Litre;
            fuelRecord.Price = req.Price;
            await _context.SaveChangesAsync();
            return UpdateOutcome.Updated;
        }
        private Vehicle? GetVehicle(int vehicleId)
        {
            return Vehicles.Where(v => v.Id == vehicleId).FirstOrDefault();
        }
        private FuelRecord? GetByOdm(int vehicleId, int odm)
        {
            return FuelRecords.Where(f => f.VehicleId == vehicleId && f.Odm == odm).FirstOrDefault();
        }
    }
}
