using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fortinite_Project.Web.Data;
using Fortinite_Project.Web.Models;
using Fortinite_Project.Web.DTOs;

namespace Fortinite_Project.Web.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CosmeticosController : ControllerBase
{
    private readonly AppDbContext _context;

    public CosmeticosController(AppDbContext context)
    {
        _context = context;
    }
    [HttpGet]
    public async Task<ActionResult<BaseResponse_DTO<object>>> GetCosmeticos(
        [FromQuery] string? nome,
        [FromQuery] string? tipo,
        [FromQuery] string? raridade,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _context.Cosmeticos.AsQueryable();

        if (!string.IsNullOrEmpty(nome))
        {
            query = query.Where(c => c.Nome != null && c.Nome.ToLower().Contains(nome.ToLower()));
        }

        if (!string.IsNullOrEmpty(tipo))
        {
            query = query.Where(c => c.Tipo != null && c.Tipo.ToLower() == tipo.ToLower());
        }

        if (!string.IsNullOrEmpty(raridade))
        {
            query = query.Where(c => c.Raridade != null && c.Raridade.ToLower() == raridade.ToLower());
        }

        var totalItems = await query.CountAsync();

        var itensEntity = await query
            .AsNoTracking()
            .TagWith(nameof(GetCosmeticos))
            .OrderByDescending(c => c.dataInclusao)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var itensDto = itensEntity.Select(c => new CosmeticoApi_DTO
        {
            Id = c.Id,
            Nome = c.Nome,
            Descricao = c.Descricao,
            Preco = c.Preco,
            dataInclusao = c.dataInclusao,
            TypeInfo = new FortniteTypeInfo { DisplayValue = c.Tipo, Value = c.Tipo },
            Rarity = new FortniteRarityInfo { DisplayValue = c.Raridade },
            Images = new FortniteImages { Small = c.UrlImagem, Large = c.UrlImagem, Icon = c.UrlImagem }
        }).ToList();

        return Ok(new BaseResponse_DTO<object>
        {
            Status = 200,
            Message = "Dados recuperados com sucesso",
            Data = new 
            {
                Total = totalItems,
                Page = page,
                PageSize = pageSize,
                Data = itensDto
            }
        });
    }

    [HttpGet("loja")]
    public async Task<ActionResult<BaseResponse_DTO<IEnumerable<CosmeticoApi_DTO>>>> GetLojaDiaria()
    {
        var itensEntity = await _context.Cosmeticos
            .Where(c => c.isForSale == true)
            .ToListAsync();

        var itensDto = itensEntity.Select(c => new CosmeticoApi_DTO
        {
            Id = c.Id,
            Nome = c.Nome,
            Descricao = c.Descricao,
            Preco = c.Preco,
            dataInclusao = c.dataInclusao,
            TypeInfo = new FortniteTypeInfo { DisplayValue = c.Tipo, Value = c.Tipo },
            Rarity = new FortniteRarityInfo { DisplayValue = c.Raridade },
            Images = new FortniteImages { Small = c.UrlImagem, Large = c.UrlImagem, Icon = c.UrlImagem }
        });

        return Ok(new BaseResponse_DTO<IEnumerable<CosmeticoApi_DTO>>
        {
            Status = 200,
            Message = "Loja diária carregada",
            Data = itensDto
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BaseResponse_DTO<CosmeticoApi_DTO>>> GetCosmetico(string id)
    {
        var c = await _context.Cosmeticos.FindAsync(id);

        if (c == null)
        {
            return NotFound(new BaseResponse_DTO 
            { 
                Status = 404, 
                Message = "Cosmético não encontrado." 
            });
        }
        
        var dto = new CosmeticoApi_DTO
        {
            Id = c.Id,
            Nome = c.Nome,
            Descricao = c.Descricao,
            Preco = c.Preco,
            dataInclusao = c.dataInclusao,
            TypeInfo = new FortniteTypeInfo { DisplayValue = c.Tipo, Value = c.Tipo },
            Rarity = new FortniteRarityInfo { DisplayValue = c.Raridade },
            Images = new FortniteImages { Small = c.UrlImagem, Large = c.UrlImagem, Icon = c.UrlImagem }
        };

        return Ok(new BaseResponse_DTO<CosmeticoApi_DTO>
        {
            Status = 200,
            Message = "Sucesso",
            Data = dto
        });
    }
}