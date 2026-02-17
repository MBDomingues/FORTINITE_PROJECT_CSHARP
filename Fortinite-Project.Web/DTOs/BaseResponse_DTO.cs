namespace Fortinite_Project.Web.DTOs;
public class BaseResponse_DTO
{
    public int Status { get; set; }
    public string? Message { get; set; }
}

public class BaseResponse_DTO<T> : BaseResponse_DTO
{
    public T? Data { get; set; }
}